import React from 'react';
import '../admin.scss';

const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="admin-layout">
      <div className="admin-layout__content">
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
