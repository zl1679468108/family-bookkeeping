import React from 'react';
import { Button } from '../../../components/ui/Button'
import { Icon } from '../../../components/ui/Icon';
import { bookMemberRoleLabel, isBookOwnerRole } from '../../../utils/roles'
import { ListRowsSkeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { userDisplayName } from '../../../utils/userDisplay'
import { EMPTY_NO_OTHER_MEMBERS } from '../../../utils/emptyCopy';

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
          description={EMPTY_NO_OTHER_MEMBERS}
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
              <div className="member-name">{userDisplayName(member)}</div>
              <div className="member-email">{member.email}</div>
            </div>
            <div className="member-role">
              {member.role && (
                <span className={`role-badge ${member.role}`}>
                  {bookMemberRoleLabel(member.role)}
                </span>
              )}
              {!isBookOwnerRole(member.role) && (
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
