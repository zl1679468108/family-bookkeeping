import { useNavigate } from 'react-router-dom';

export const useBudgetNavigate = () => {
  const navigate = useNavigate();

  return (categoryId: string, monthKey: string) => {
    const [yearStr, monthStr] = monthKey.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const lastDay = new Date(year, month, 0).getDate();

    const startDate = `${monthKey}-01`;
    const endDate = `${monthKey}-${String(lastDay).padStart(2, '0')}`;

    navigate(
      `/transactions?category=${encodeURIComponent(categoryId)}&startDate=${startDate}&endDate=${endDate}`
    );
  };
};
