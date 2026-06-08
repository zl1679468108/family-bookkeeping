import React, { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { LocationPicker } from '../AddTransaction/components/LocationPicker';
import { FormGroup, FormRow } from '../../components/Form';
import { Header } from '../../components/Header';
import { notify } from '../../utils/notifications';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTemplates, useCreateTemplate, useUpdateTemplate, useDeleteTemplate } from '../../hooks/useTemplates';
import { useCategories } from '../../hooks/useCategories';
import { typeOptions } from '../../utils/commonDic';
import type { CreateTemplateInput } from '../../types/template';
import type { LocationResult } from '../../types/map';
import './index.scss';

const TemplateManager: React.FC = () => {
  const { data: templates = [], isLoading } = useTemplates();
  const { data: categories = [] } = useCategories();
  const createMutation = useCreateTemplate();
  const updateMutation = useUpdateTemplate();
  const deleteMutation = useDeleteTemplate();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);

  const [form, setForm] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    category_id: '',
    note: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    location_name: '',
    poi_id: '',
  });

  const resetForm = () => {
    setForm({
      name: '', type: 'expense', category_id: '',
      note: '', latitude: undefined, longitude: undefined, location_name: '', poi_id: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleLocationConfirm = (result: LocationResult) => {
    if (result.latitude === 0 && result.longitude === 0) {
      setForm(prev => ({ ...prev, latitude: undefined, longitude: undefined, location_name: '', poi_id: '' }));
    } else {
      setForm(prev => ({
        ...prev,
        latitude: result.latitude,
        longitude: result.longitude,
        location_name: result.locationName,
        poi_id: result.poiId || '',
      }));
    }
    setShowLocationPicker(false);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const data: CreateTemplateInput = {
      name: form.name.trim(),
      type: form.type,
      category_id: form.category_id || undefined,
      note: form.note || undefined,
      latitude: form.latitude,
      longitude: form.longitude,
      location_name: form.location_name || undefined,
      poi_id: form.poi_id || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, data }, {
        onSuccess: () => { notify({ type: 'success', message: '模板已更新' }); resetForm(); },
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => { notify({ type: 'success', message: '模板已创建' }); resetForm(); },
      });
    }
  };

  const handleEdit = (t: any) => {
    setForm({
      name: t.name, type: t.type, category_id: t.category_id || '',
      note: t.note || '',
      latitude: t.latitude, longitude: t.longitude,
      location_name: t.location_name || '',
      poi_id: t.poi_id || '',
    });
    setEditingId(t.id);
    setShowForm(true);
  };

  const handleCopy = (t: any) => {
    setForm({
      name: `${t.name}（复制）`, type: t.type, category_id: t.category_id || '',
      note: t.note || '',
      latitude: t.latitude, longitude: t.longitude,
      location_name: t.location_name || '',
      poi_id: t.poi_id || '',
    });
    setEditingId(null); // 不设置editingId，作为新模板创建
    setShowForm(true);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteMutation.mutate(deleteId, {
        onSuccess: () => { notify({ type: 'success', message: '已删除' }); setDeleteId(null); resetForm(); },
      });
    }
  };

  const categoryOptions = categories
    .filter(c => c.type === form.type)
    .map(c => ({ value: c.id, label: `${c.icon} ${c.name}` }));

  return (
    <div className="page-container">
      <Header title="交易模板">
        <button onClick={() => { resetForm(); setShowForm(true); }} style={{
          padding: '8px 16px', borderRadius: 6, border: 'none',
          background: 'var(--accent)', color: '#fff', cursor: 'pointer', fontSize: 13,
        }}>+ 新建模板</button>
      </Header>

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          {/* 第一行：模板名称 */}
          <FormGroup label="模板名称">
            <input type="text" className="form-input" placeholder="如：公司食堂午餐"
              value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} />
          </FormGroup>

          {/* 第二行：类型 + 分类 */}
          <FormRow>
            <FormGroup label="类型">
              <select className="form-select" value={form.type}
                onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value as 'expense' | 'income', category_id: '' }))}>
                {typeOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="分类">
              <select className="form-select" value={form.category_id}
                onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value }))}>
                <option value="">选择分类</option>
                {categoryOptions.map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </FormGroup>
          </FormRow>

          {/* 备注 */}
          <FormGroup label="备注">
            <input type="text" className="form-input" placeholder="添加备注（可选）"
              value={form.note} onChange={(e) => setForm(prev => ({ ...prev, note: e.target.value }))} />
          </FormGroup>

          {/* 第六行：位置（地图选点，与记一笔一致） */}
          <FormGroup label="位置">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowLocationPicker(true)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {form.location_name ? '更换位置' : '选择位置'}
                </button>
                {form.location_name && (
                  <button type="button" className="btn btn-text" style={{ color: 'var(--danger)' }}
                    onClick={() => setForm(prev => ({ ...prev, latitude: undefined, longitude: undefined, location_name: '', poi_id: '' }))}>
                    清除
                  </button>
                )}
              </div>
              {form.location_name && (
                <div style={{ fontSize: 13, color: 'var(--muted)', padding: '8px 12px', background: 'var(--bg)', borderRadius: 6 }}>
                  <div>📍 {form.location_name}</div>
                  {form.latitude && form.longitude && (
                    <div style={{ fontSize: 11, marginTop: 2 }}>
                      经纬度：{form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                      {form.poi_id && ` · POI: ${form.poi_id}`}
                    </div>
                  )}
                </div>
              )}
            </div>
          </FormGroup>

          {/* 操作按钮 */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <button onClick={resetForm} className="btn btn-secondary">取消</button>
            <button onClick={handleSave} className="btn btn-primary">
              {editingId ? '更新模板' : '创建模板'}
            </button>
          </div>
        </div>
      )}

      {/* 模板列表 */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px 0' }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderRadius: '10px', background: '#fff' }}>
              <Skeleton width="44px" height="44px" borderRadius="10px" />
              <div style={{ flex: 1, marginLeft: '14px', marginRight: '12px' }}>
                <Skeleton width="50%" height="15px" marginBottom="8px" />
                <Skeleton width="70%" height="13px" />
              </div>
              <Skeleton width="48px" height="14px" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>暂无模板，点击上方按钮创建</div>
      ) : (
        <div className="template-list">
          {templates.map(t => {
            const cat = t.category_id ? categories.find(c => c.id === t.category_id) : null;
            return (
              <div key={t.id} className="template-item">
                <div className="template-item__info">
                  <div className="template-item__name">
                    📋 {t.name}
                  </div>
                  <div className="template-item__meta">
                    <span className={`template-item__meta-tag ${t.type}`}>
                      {t.type === 'income' ? '💰 收入' : '💸 支出'}
                    </span>
                    {cat && (
                      <span className="template-item__meta-tag">
                        {cat.icon} {cat.name}
                      </span>
                    )}
                    {t.location_name && (
                      <span className="template-item__meta-tag">
                        📍 {t.location_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="template-item__actions">
                  <button onClick={() => handleCopy(t)} className="template-item__btn template-item__btn--copy" title="复制">
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
                      <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
                    </svg>
                    复制
                  </button>
                  <button onClick={() => handleEdit(t)} className="template-item__btn" title="编辑">
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                    编辑
                  </button>
                  <button onClick={() => setDeleteId(t.id)} className="template-item__btn template-item__btn--delete" title="删除">
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    删除
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 地图选点弹窗 */}
      <LocationPicker
        visible={showLocationPicker}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={handleLocationConfirm}
        initialLocation={form.latitude ? { latitude: form.latitude, longitude: form.longitude!, locationName: form.location_name, poiId: null } : null}
      />

      <ConfirmDialog open={!!deleteId} title="确认删除" message="确定要删除这个模板吗？"
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)} loading={deleteMutation.isPending} />
    </div>
  );
};

export default TemplateManager;
