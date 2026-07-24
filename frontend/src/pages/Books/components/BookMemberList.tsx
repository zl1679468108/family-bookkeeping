import React from 'react';
import { Button } from '../../../components/ui/Button'
import { Icon } from '../../../components/ui/Icon';
import { ListRowsSkeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';

interface BookMemberListProps {
  members: any[];
  loading?: boolean;
  onRemoveMember: (member: any) => void;
  onInvite?: () => void;
}

export const BookMemberList: React.FC<BookMemberListProps> = ({
  members,
  loading,
  onRemoveMember,
  onInvite,
}) => {
  const renderBody = () => {
    // 数据加载中：显示骨架屏
    if (loading) {
      return <ListRowsSkeleton rows={4} showIcon showAmount={false} />;
    }
    // 无数据：显示空状态
    if (members.length === 0) {
      return (
        <EmptyState
          variant="compact"
          description="还没有其他成员，邀请家人一起记账吧"
          action={
            onInvite ? (
              <Button variant="primary" size="sm" onClick={onInvite}>
                邀请成员
              </Button>
            ) : undefined
          }
        />
      );
    }
    // 正常列表
    return (
      <div className="member-list">
        {members.map((member: any) => (
          <div key={member.id} className="member-item">
            <div className="member-info">
              <div className="member-name">{member.username || member.email}</div>
              <div className="member-email">{member.email}</div>
            </div>
            <div className="member-role">
              {member.role === 'owner' && <span className="role-badge owner">账主</span>}
              {member.role === 'admin' && <span className="role-badge admin">管理员</span>}
              {member.role === 'member' && <span className="role-badge member">成员</span>}
              {member.role !== 'owner' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveMember(member)}
                  title="移除成员"
                >
                  <Icon name="close" size={14} />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="detail-divider" />
      <div className="member-section">
        <div className="member-section-header">
          <div className="member-section-title">成员明细</div>
          {!loading && members.length > 0 && (
            <div className="member-section-count">{members.length} 人</div>
          )}
        </div>
        {renderBody()}
      </div>
    </>
  );
};
