/**
 * Icon — 几何线型图标系统
 * 温暖轻奢风格：细线轮廓，珊瑚橙配色
 */
import { View } from "@tarojs/components";

export type IconName =
  | "home"
  | "transactions"
  | "add"
  | "statistics"
  | "profile"
  | "back"
  | "search"
  | "edit"
  | "delete"
  | "book"
  | "budget"
  | "category"
  | "location"
  | "calendar"
  | "note"
  | "user"
  | "email"
  | "lock"
  | "close"
  | "template";

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export default function Icon({
  name,
  size = 44,
  color = "currentColor",
}: IconProps) {
  const s = `${size}rpx`;

  const style = {
    width: s,
    height: s,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  };

  return (
    <View style={style}>
      {name === "home" && <HomeIcon size={size} color={color} />}
      {name === "transactions" && (
        <TransactionsIcon size={size} color={color} />
      )}
      {name === "add" && <AddIcon size={size} color={color} />}
      {name === "statistics" && <StatisticsIcon size={size} color={color} />}
      {name === "profile" && <ProfileIcon size={size} color={color} />}
      {name === "back" && <BackIcon size={size} color={color} />}
      {name === "search" && <SearchIcon size={size} color={color} />}
      {name === "close" && <CloseIcon size={size} color={color} />}
      {name === "delete" && <DeleteIcon size={size} color={color} />}
      {name === "edit" && <EditIcon size={size} color={color} />}
      {name === "book" && <BookIcon size={size} color={color} />}
      {name === "budget" && <BudgetIcon size={size} color={color} />}
      {name === "category" && <CategoryIcon size={size} color={color} />}
      {name === "location" && <LocationIcon size={size} color={color} />}
      {name === "calendar" && <CalendarIcon size={size} color={color} />}
      {name === "note" && <NoteIcon size={size} color={color} />}
      {name === "user" && <UserIcon size={size} color={color} />}
      {name === "email" && <EmailIcon size={size} color={color} />}
      {name === "lock" && <LockIcon size={size} color={color} />}
      {name === "template" && <TemplateIcon size={size} color={color} />}
    </View>
  );
}

/* Home — outline house with door */
function HomeIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View style={{ position: "relative", width: `${s}rpx`, height: `${s}rpx` }}>
      <View
        style={{
          position: "absolute",
          top: `${s * 0.05}rpx`,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: `${s * 0.35}rpx solid transparent`,
          borderRight: `${s * 0.35}rpx solid transparent`,
          borderBottom: `${s * 0.28}rpx solid ${color}`,
          opacity: 0.15,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: `${s * 0.15}rpx`,
          left: 0,
          right: 0,
          height: `${s * 0.55}rpx`,
          border: `2.5rpx solid ${color}`,
          borderTop: "none",
          borderRadius: "0 0 3rpx 3rpx",
          marginTop: `${s * 0.16}rpx`,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: "2rpx",
          left: "50%",
          transform: "translateX(-50%)",
          width: `${s * 0.18}rpx`,
          height: `${s * 0.26}rpx`,
          border: `2.5rpx solid ${color}`,
          borderRadius: "2rpx 2rpx 0 0",
          borderBottom: "none",
        }}
      />
    </View>
  );
}

/* Transactions — three stacked lines */
function TransactionsIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  const lw = `${s * 0.56}rpx`;
  const lh = "3rpx";
  const g = `${s * 0.16}rpx`;
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: g,
      }}
    >
      <View
        style={{
          width: lw,
          height: lh,
          backgroundColor: color,
          borderRadius: "1.5rpx",
        }}
      />
      <View
        style={{
          width: `${s * 0.44}rpx`,
          height: lh,
          backgroundColor: `${color}`,
          borderRadius: "1.5rpx",
          opacity: 0.4,
        }}
      />
      <View
        style={{
          width: lw,
          height: lh,
          backgroundColor: color,
          borderRadius: "1.5rpx",
        }}
      />
    </View>
  );
}

/* Add — plus in circle */
function AddIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  const t = `${s * 0.16}rpx`;
  return (
    <View style={{ position: "relative", width: `${s}rpx`, height: `${s}rpx` }}>
      <View
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: t,
            height: `${s * 0.42}rpx`,
            backgroundColor: color,
            borderRadius: "2rpx",
          }}
        />
        <View
          style={{
            position: "absolute",
            width: `${s * 0.42}rpx`,
            height: t,
            backgroundColor: color,
            borderRadius: "2rpx",
          }}
        />
      </View>
    </View>
  );
}

/* Statistics — three ascending bars */
function StatisticsIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  const bw = `${s * 0.13}rpx`;
  const g = `${s * 0.1}rpx`;
  return (
    <View
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: g,
        height: `${s * 0.62}rpx`,
      }}
    >
      <View
        style={{
          width: bw,
          height: `${s * 0.26}rpx`,
          backgroundColor: color,
          borderRadius: "2rpx 2rpx 0 0",
          opacity: 0.4,
        }}
      />
      <View
        style={{
          width: bw,
          height: `${s * 0.44}rpx`,
          backgroundColor: color,
          borderRadius: "2rpx 2rpx 0 0",
        }}
      />
      <View
        style={{
          width: bw,
          height: `${s * 0.62}rpx`,
          backgroundColor: color,
          borderRadius: "2rpx 2rpx 0 0",
        }}
      />
    </View>
  );
}

/* Profile — outline person */
function ProfileIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <View
        style={{
          width: `${s * 0.3}rpx`,
          height: `${s * 0.3}rpx`,
          border: `2.5rpx solid ${color}`,
          borderRadius: "50%",
        }}
      />
      <View
        style={{
          width: `${s * 0.56}rpx`,
          height: `${s * 0.35}rpx`,
          border: `2.5rpx solid ${color}`,
          borderRadius: `${s * 0.28}rpx ${s * 0.28}rpx 0 0`,
          borderBottom: "none",
          marginTop: `${s * 0.06}rpx`,
        }}
      />
    </View>
  );
}

/* Back — left chevron */
function BackIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  const t = `${s * 0.18}rpx`;
  return (
    <View
      style={{
        width: t,
        height: t,
        borderLeft: `3rpx solid ${color}`,
        borderBottom: `3rpx solid ${color}`,
        transform: "rotate(45deg)",
        marginLeft: `${s * 0.1}rpx`,
      }}
    />
  );
}

/* Search — magnifying glass */
function SearchIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View style={{ position: "relative", width: `${s}rpx`, height: `${s}rpx` }}>
      <View
        style={{
          position: "absolute",
          top: `${s * 0.12}rpx`,
          left: `${s * 0.12}rpx`,
          width: `${s * 0.5}rpx`,
          height: `${s * 0.5}rpx`,
          borderRadius: "50%",
          border: `2.5rpx solid ${color}`,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: `${s * 0.14}rpx`,
          right: `${s * 0.14}rpx`,
          width: "3rpx",
          height: `${s * 0.28}rpx`,
          backgroundColor: color,
          borderRadius: "1.5rpx",
          transform: "rotate(-45deg)",
          transformOrigin: "top center",
        }}
      />
    </View>
  );
}

/* Close — X mark */
function CloseIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View style={{ position: "relative", width: `${s}rpx`, height: `${s}rpx` }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: "2.5rpx",
          height: `${s}rpx`,
          backgroundColor: color,
          borderRadius: "1.5rpx",
          transform: "rotate(45deg)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          width: "2.5rpx",
          height: `${s}rpx`,
          backgroundColor: color,
          borderRadius: "1.5rpx",
          transform: "rotate(-45deg)",
        }}
      />
    </View>
  );
}

/* Delete — trash bin */
function DeleteIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2rpx",
      }}
    >
      <View
        style={{
          width: `${s * 0.75}rpx`,
          height: "3rpx",
          backgroundColor: color,
          borderRadius: "1.5rpx",
        }}
      />
      <View
        style={{
          width: `${s * 0.3}rpx`,
          height: "3rpx",
          backgroundColor: color,
          borderRadius: "1.5rpx",
        }}
      />
      <View
        style={{
          width: `${s * 0.55}rpx`,
          height: `${s * 0.42}rpx`,
          border: `2.5rpx solid ${color}`,
          borderRadius: "0 0 4rpx 4rpx",
          borderTop: "none",
        }}
      />
    </View>
  );
}

/* Edit — pencil */
function EditIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  const t = `${s * 0.16}rpx`;
  return (
    <View style={{ position: "relative", width: `${s}rpx`, height: `${s}rpx` }}>
      <View
        style={{
          position: "absolute",
          bottom: `${s * 0.2}rpx`,
          left: `${s * 0.2}rpx`,
          width: `${s * 0.46}rpx`,
          height: "3rpx",
          backgroundColor: color,
          borderRadius: "1.5rpx",
          transform: "rotate(-45deg)",
          transformOrigin: "left center",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: `${s * 0.14}rpx`,
          right: `${s * 0.24}rpx`,
          width: t,
          height: t,
          borderTop: `3rpx solid ${color}`,
          borderRight: `3rpx solid ${color}`,
        }}
      />
    </View>
  );
}

/* Book — book outline */
function BookIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View
      style={{
        position: "relative",
        width: `${s * 0.7}rpx`,
        height: `${s * 0.8}rpx`,
        border: `2.5rpx solid ${color}`,
        borderRadius: "3rpx 5rpx 5rpx 3rpx",
      }}
    >
      <View
        style={{
          position: "absolute",
          left: "22%",
          top: "18%",
          width: "36%",
          height: "3rpx",
          backgroundColor: color,
          borderRadius: "1.5rpx",
          opacity: 0.35,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: "22%",
          top: "42%",
          width: "48%",
          height: "3rpx",
          backgroundColor: color,
          borderRadius: "1.5rpx",
          opacity: 0.35,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: "22%",
          top: "66%",
          width: "28%",
          height: "3rpx",
          backgroundColor: color,
          borderRadius: "1.5rpx",
          opacity: 0.35,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: "-2.5rpx",
          top: "6%",
          bottom: "6%",
          width: "2.5rpx",
          backgroundColor: color,
          borderRadius: "1.5rpx",
        }}
      />
    </View>
  );
}

/* Budget — chart with bars */
function BudgetIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: `${s * 0.08}rpx`,
        padding: `${s * 0.1}rpx`,
      }}
    >
      <View
        style={{
          width: `${s * 0.15}rpx`,
          height: `${s * 0.4}rpx`,
          border: `2.5rpx solid ${color}`,
          borderRadius: "2rpx 2rpx 0 0",
          borderBottom: "none",
        }}
      />
      <View
        style={{
          width: `${s * 0.15}rpx`,
          height: `${s * 0.6}rpx`,
          backgroundColor: color,
          borderRadius: "2rpx 2rpx 0 0",
        }}
      />
      <View
        style={{
          width: `${s * 0.15}rpx`,
          height: `${s * 0.45}rpx`,
          border: `2.5rpx solid ${color}`,
          borderRadius: "2rpx 2rpx 0 0",
          borderBottom: "none",
        }}
      />
    </View>
  );
}

/* Category — 2x2 grid */
function CategoryIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  const b = `${s * 0.28}rpx`;
  const g = `${s * 0.08}rpx`;
  return (
    <View
      style={{
        display: "flex",
        flexWrap: "wrap",
        width: `${s * 0.64}rpx`,
        height: `${s * 0.64}rpx`,
        gap: g,
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            width: b,
            height: b,
            backgroundColor: i === 1 ? color : "transparent",
            border: i === 1 ? "none" : `2.5rpx solid ${color}`,
            borderRadius: "3rpx",
            opacity: i === 1 ? 1 : 0.35,
          }}
        />
      ))}
    </View>
  );
}

/* Location — pin marker */
function LocationIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View style={{ position: "relative", width: `${s}rpx`, height: `${s}rpx` }}>
      <View
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: `${s * 0.3}rpx`,
          height: `${s * 0.3}rpx`,
          borderRadius: "50%",
          border: `2.5rpx solid ${color}`,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: `${s * 0.28}rpx`,
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: `${s * 0.16}rpx solid transparent`,
          borderRight: `${s * 0.16}rpx solid transparent`,
          borderTop: `${s * 0.28}rpx solid ${color}`,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: `${s * 0.08}rpx`,
          left: "50%",
          transform: "translateX(-50%)",
          width: `${s * 0.12}rpx`,
          height: `${s * 0.12}rpx`,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/* Calendar — date card */
function CalendarIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View
      style={{
        width: `${s * 0.66}rpx`,
        height: `${s * 0.76}rpx`,
        border: `2.5rpx solid ${color}`,
        borderRadius: "4rpx",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <View
        style={{
          height: `${s * 0.18}rpx`,
          backgroundColor: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: `${s * 0.18}rpx`,
            height: "2rpx",
            backgroundColor: "#FFF",
            borderRadius: "1rpx",
          }}
        />
      </View>
      <View
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: `${s * 0.28}rpx`,
            height: `${s * 0.18}rpx`,
            border: `2rpx solid ${color}`,
            borderRadius: "2rpx",
            opacity: 0.3,
          }}
        />
      </View>
    </View>
  );
}

/* Note — document with lines */
function NoteIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View
      style={{
        width: `${s * 0.62}rpx`,
        height: `${s * 0.76}rpx`,
        border: `2.5rpx solid ${color}`,
        borderRadius: "4rpx",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        padding: `${s * 0.12}rpx ${s * 0.1}rpx`,
      }}
    >
      <View
        style={{
          width: "100%",
          height: "2.5rpx",
          backgroundColor: color,
          borderRadius: "1.5rpx",
          opacity: 0.3,
        }}
      />
      <View
        style={{
          width: "76%",
          height: "2.5rpx",
          backgroundColor: color,
          borderRadius: "1.5rpx",
          opacity: 0.3,
        }}
      />
      <View
        style={{
          width: "56%",
          height: "2.5rpx",
          backgroundColor: color,
          borderRadius: "1.5rpx",
          opacity: 0.3,
        }}
      />
      <View
        style={{
          width: "36%",
          height: "2.5rpx",
          backgroundColor: color,
          borderRadius: "1.5rpx",
          opacity: 0.3,
        }}
      />
    </View>
  );
}

/* User — simple avatar */
function UserIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <View
        style={{
          width: `${s * 0.34}rpx`,
          height: `${s * 0.34}rpx`,
          border: `2.5rpx solid ${color}`,
          borderRadius: "50%",
        }}
      />
      <View
        style={{
          width: `${s * 0.64}rpx`,
          height: `${s * 0.34}rpx`,
          border: `2.5rpx solid ${color}`,
          borderRadius: `${s * 0.16}rpx ${s * 0.16}rpx 0 0`,
          borderBottom: "none",
          marginTop: `${s * 0.06}rpx`,
        }}
      />
    </View>
  );
}

/* Email — envelope */
function EmailIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View
      style={{
        position: "relative",
        width: `${s * 0.76}rpx`,
        height: `${s * 0.5}rpx`,
        border: `2.5rpx solid ${color}`,
        borderRadius: "4rpx",
      }}
    >
      <View
        style={{
          position: "absolute",
          top: "-2.5rpx",
          left: "-2.5rpx",
          right: "-2.5rpx",
          height: `${s * 0.22}rpx`,
          overflow: "hidden",
        }}
      >
        <View
          style={{
            position: "absolute",
            top: "65%",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: color,
            borderRadius: "0 0 2rpx 2rpx",
            opacity: 0.15,
          }}
        />
      </View>
    </View>
  );
}

/* Template — page with lines */
function TemplateIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View
      style={{
        position: "relative",
        width: `${s * 0.5}rpx`,
        height: `${s * 0.64}rpx`,
      }}
    >
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          border: `2.5rpx solid ${color}`,
          borderRadius: "4rpx",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: `${s * 0.08}rpx`,
          left: "-2.5rpx",
          width: `${s * 0.3}rpx`,
          height: 0,
          borderTop: `2.5rpx solid ${color}`,
          borderRadius: "2rpx",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: `${s * 0.22}rpx`,
          left: "-2.5rpx",
          width: `${s * 0.42}rpx`,
          height: 0,
          borderTop: `2.5rpx solid ${color}`,
          borderRadius: "2rpx",
          opacity: 0.5,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: `${s * 0.36}rpx`,
          left: "-2.5rpx",
          width: `${s * 0.32}rpx`,
          height: 0,
          borderTop: `2.5rpx solid ${color}`,
          borderRadius: "2rpx",
          opacity: 0.5,
        }}
      />
      <View
        style={{
          position: "absolute",
          top: `${s * 0.5}rpx`,
          left: "-2.5rpx",
          width: `${s * 0.38}rpx`,
          height: 0,
          borderTop: `2.5rpx solid ${color}`,
          borderRadius: "2rpx",
          opacity: 0.5,
        }}
      />
    </View>
  );
}

/* Lock — lock shape */
function LockIcon({ size, color }: { size: number; color: string }) {
  const s = size;
  return (
    <View
      style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <View
        style={{
          width: `${s * 0.32}rpx`,
          height: `${s * 0.28}rpx`,
          border: `2.5rpx solid ${color}`,
          borderBottom: "none",
          borderRadius: `${s * 0.16}rpx ${s * 0.16}rpx 0 0`,
        }}
      />
      <View
        style={{
          width: `${s * 0.5}rpx`,
          height: `${s * 0.35}rpx`,
          border: `2.5rpx solid ${color}`,
          borderRadius: "4rpx",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: `${s * 0.1}rpx`,
            height: `${s * 0.1}rpx`,
            borderRadius: "50%",
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}
