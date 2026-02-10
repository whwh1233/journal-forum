import { useToastContext } from '@/contexts/ToastContext';

export const useToast = () => {
  const { success, error, warning, info, addToast, removeToast } = useToastContext();

  return {
    success,
    error,
    warning,
    info,
    addToast,
    removeToast,
    // 便捷方法
    notify: addToast,
  };
};

export default useToast;
