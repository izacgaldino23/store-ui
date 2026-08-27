import { useEffect, useRef, useCallback } from 'react';
import { Modal } from 'antd';

/**
 * Guards against losing unsaved order data.
 *
 * - Registers a native `beforeunload` handler while the form is dirty, so the
 *   browser prompts the user on reload / tab close / external navigation.
 * - Exposes `confirmLeave()`, an async helper that resolves `true` only when it
 *   is safe to leave (nothing dirty, or the user confirms discarding changes).
 *   Use it for in-app "Voltar" buttons that call `navigate()`.
 */
export function useUnsavedOrderGuard(isDirty: boolean): { confirmLeave: () => Promise<boolean> } {
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const confirmLeave = useCallback(() => {
    if (!dirtyRef.current) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => {
      Modal.confirm({
        title: 'Descartar alterações?',
        content:
          'Este pedido tem informações não salvas. Ao sair, tudo o que foi preenchido será perdido.',
        okText: 'Sair e descartar',
        okButtonProps: { danger: true },
        cancelText: 'Continuar editando',
        onOk: () => resolve(true),
        onCancel: () => resolve(false),
      });
    });
  }, []);

  return { confirmLeave };
}
