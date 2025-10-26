function createEditor(selector, hiddenInputName) {
  const editor = document.querySelector(selector);
  const hidden = document.querySelector(`[name="${hiddenInputName}"]`);
  if (!editor || !hidden) return null;

  const quill = new Quill('#editor', {
	modules: { toolbar: false },
	theme: 'snow'
  });
  
  const form = editor.closest('form');
  if (form) {
    form.addEventListener('submit', () => {
      hidden.value = quill.root.innerHTML;
    });
  }

  return quill;
}
