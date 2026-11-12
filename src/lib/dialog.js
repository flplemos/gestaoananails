/*
 * Diálogos de confirmação e aviso no visual do app (substituem confirm() e
 * alert() do navegador, que no iPhone aparecem com o endereço do site).
 * Uso:  if (!(await confirmDialog({ title: 'Excluir?', danger: true }))) return
 * Quem desenha é o <DialogHost /> (montado uma vez no App).
 */

let current = null
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn())

export const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export const getDialog = () => current

function open(options) {
  return new Promise((resolve) => {
    current?.resolve(false) // um diálogo novo cancela o anterior
    current = { ...options, resolve }
    emit()
  })
}

export function closeDialog(result) {
  const dialog = current
  current = null
  emit()
  dialog?.resolve(result)
}

/** Resolve `true` se a pessoa confirmar. */
export const confirmDialog = ({ confirmLabel = 'Confirmar', cancelLabel = 'Cancelar', ...rest }) =>
  open({ confirmLabel, cancelLabel, ...rest })

/** Aviso com um único botão. */
export const alertDialog = (title, message) => open({ title, message, confirmLabel: 'Ok', cancelLabel: null })
