document.addEventListener("click", (e) => {
  e.preventDefault();
  if (e.target.tagName === "IMG" && e.target.src) {
    window.top.$$openImagePreview(e.target.src);
  }
});
