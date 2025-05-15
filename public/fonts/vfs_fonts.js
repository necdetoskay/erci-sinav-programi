// Bu dosya, pdfMake için özel fontları tanımlar
// Roboto fontları için virtual file system (vfs) tanımlaması
this.pdfMake = this.pdfMake || {};
this.pdfMake.vfs = {
  'Roboto-Regular.ttf': window.atob('...base64 encoded font...'),
  'Roboto-Bold.ttf': window.atob('...base64 encoded font...')
};
