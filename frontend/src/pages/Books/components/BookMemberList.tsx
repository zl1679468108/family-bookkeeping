import React from 'react';
import { Button } from '../../../components/ui/Button';

interface BookMemberListProps {
  members: any[];
  onRemoveMember: (member: any) => void;
}

export const BookMemberList: React.FC<BookMemberListProps> = ({ members, onRemoveMember }) => {
  if (members.length === 0) return null;

  return (
    <>
      <div className="detail-divider" />
      <div className="member-section">
        <div className="member-section-header">
          <div className="member-section-title">成员明细</div>
        </div>
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
                    ✕
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
