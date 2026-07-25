import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

export interface ReverseGeocodeResult {
  /** 格式化地址（高德 formatted_address） */
  address: string;
  poiName?: string;
  poiId?: string;
  /** 与 PC 选点确认文案一致：poiName + ' ' + address */
  locationName: string;
  latitude: number;
  longitude: number;
}

export interface PoiSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  poiId: string;
}

interface AmapRegeoResponse {
  status: string;
  info?: string;
  infocode?: string;
  regeocode?: {
    formatted_address?: string | string[];
    pois?: Array<{
      id?: string;
      name?: string;
      address?: string | string[];
    }>;
  };
}

interface AmapPlaceResponse {
  status: string;
  info?: string;
  infocode?: string;
  pois?: Array<{
    id?: string;
    name?: string;
    address?: string | string[];
    location?: string;
  }>;
}

/**
 * 高德 Web 服务（REST）封装。
 * 供小程序端逆地理编码 / POI 搜索使用，与 PC 端 JS SDK 选点信息对齐。
 */
@Injectable()
export class AmapService {
  private readonly logger = new Logger(AmapService.name);
  private readonly regeoUrl = 'https://restapi.amap.com/v3/geocode/regeo';
  private readonly placeTextUrl = 'https://restapi.amap.com/v3/place/text';

  constructor(private readonly configService: ConfigService) {}

  private getKey(): string {
    const key = this.configService.get<string>('AMAP_KEY')?.trim();
    if (!key) {
      throw new InternalServerErrorException('地图服务未配置（缺少 AMAP_KEY）');
    }
    return key;
  }

  private getSecret(): string | undefined {
    const secret = this.configService.get<string>('AMAP_SECRET')?.trim();
    return secret || undefined;
  }

  private buildSignedUrl(baseUrl: string, params: Record<string, string>): string {
    const withKey: Record<string, string> = {
      ...params,
      key: this.getKey(),
    };
    const secret = this.getSecret();
    if (secret) {
      const sorted = Object.keys(withKey)
        .sort()
        .map((k) => `${k}=${withKey[k]}`)
        .join('&');
      withKey.sig = createHash('md5').update(sorted + secret).digest('hex');
    }

    const url = new URL(baseUrl);
    for (const [k, v] of Object.entries(withKey)) {
      url.searchParams.set(k, v);
    }
    return url.toString();
  }

  private asText(value: string | string[] | undefined | null): string {
    if (Array.isArray(value)) return value.filter(Boolean).join('') || '';
    return value || '';
  }

  private assertOk(status: string | undefined, info?: string, infocode?: string): void {
    if (status === '1') return;
    this.logger.warn(`高德 API 失败: status=${status} info=${info} infocode=${infocode}`);
    // 10001/10003 等额度/密钥类问题
    if (infocode === '10003' || info?.includes('DAILY_QUERY_OVER_LIMIT')) {
      throw new ServiceUnavailableException('地图查询额度已用完，请稍后再试');
    }
    // 10009：Key 平台类型不匹配（常见：把 JS API Key 配成了 Web 服务）
    if (infocode === '10009' || info === 'USERKEY_PLAT_NOMATCH') {
      throw new InternalServerErrorException(
        '地图服务 Key 平台不匹配：请在 backend 配置高德「Web服务」类型 AMAP_KEY',
      );
    }
    throw new InternalServerErrorException(info || '地图服务请求失败');
  }

  /**
   * 逆地理编码：坐标 → 地址名 + 最近 POI
   * 展示格式与 PC AMap.Geocoder 对齐：`poiName + ' ' + formattedAddress`
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult> {
    const url = this.buildSignedUrl(this.regeoUrl, {
      location: `${longitude},${latitude}`,
      extensions: 'all',
      radius: '200',
      roadlevel: '0',
    });

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        throw new InternalServerErrorException(`地图服务 HTTP ${res.status}`);
      }
      const data = (await res.json()) as AmapRegeoResponse;
      this.assertOk(data.status, data.info, data.infocode);

      const formatted = this.asText(data.regeocode?.formatted_address);
      const firstPoi = data.regeocode?.pois?.[0];
      const poiName = firstPoi?.name?.trim() || undefined;
      const poiId = firstPoi?.id?.trim() || undefined;
      const address =
        formatted ||
        (poiName ? poiName : `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
      // 与 frontend LocationPicker reverseGeocode 一致
      const locationName =
        poiName && poiName !== address ? `${poiName} ${address}` : address;

      return {
        address,
        poiName,
        poiId,
        locationName,
        latitude,
        longitude,
      };
    } catch (err) {
      if (
        err instanceof InternalServerErrorException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      this.logger.error('逆地理编码失败', err);
      throw new InternalServerErrorException('逆地理编码失败');
    }
  }

  /**
   * POI 关键字搜索（全国）。
   * 若传入坐标，作为 location 偏置提升周边结果相关性。
   */
  async searchPois(
    keyword: string,
    latitude?: number,
    longitude?: number,
  ): Promise<PoiSearchResult[]> {
    const trimmed = keyword.trim();
    if (!trimmed) return [];

    const params: Record<string, string> = {
      keywords: trimmed,
      city: '全国',
      offset: '10',
      page: '1',
      extensions: 'base',
      citylimit: 'false',
    };
    if (
      latitude != null &&
      longitude != null &&
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      params.location = `${longitude},${latitude}`;
    }

    const url = this.buildSignedUrl(this.placeTextUrl, params);

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) {
        throw new InternalServerErrorException(`地图服务 HTTP ${res.status}`);
      }
      const data = (await res.json()) as AmapPlaceResponse;
      this.assertOk(data.status, data.info, data.infocode);

      const list = data.pois || [];
      return list
        .map((poi): PoiSearchResult | null => {
          const location = (poi.location || '').split(',');
          if (location.length < 2) return null;
          const lng = Number(location[0]);
          const lat = Number(location[1]);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
          const name = (poi.name || '').trim();
          if (!name) return null;
          return {
            name,
            address: this.asText(poi.address),
            latitude: lat,
            longitude: lng,
            poiId: (poi.id || '').trim(),
          };
        })
        .filter((item): item is PoiSearchResult => item != null);
    } catch (err) {
      if (
        err instanceof InternalServerErrorException ||
        err instanceof ServiceUnavailableException
      ) {
        throw err;
      }
      this.logger.error('POI 搜索失败', err);
      throw new InternalServerErrorException('地点搜索失败');
    }
  }
}
