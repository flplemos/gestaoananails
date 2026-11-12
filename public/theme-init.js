// Aplica o tema salvo antes do React carregar (evita piscar o tema padrão).
// Fica em arquivo separado (e não inline no index.html) para a
// Content-Security-Policy poder bloquear qualquer script inline.
try {
  var t = localStorage.getItem('ananails:theme')
  if (t) document.documentElement.dataset.theme = t
} catch {
  /* localStorage indisponível: segue com o tema padrão */
}
