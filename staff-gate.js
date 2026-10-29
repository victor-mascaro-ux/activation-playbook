/* Only the editable version is locked: the editor (index.html?edit=1) keeps its own password. Every toolkit page,
   the original ones and the firm editions, is open to anyone (Victor, 2026-10-29: "it's the editable versions that
   should be locked"; closing the original toolkits had locked out the advisors who use them every day). A firm link
   whose firm has a password (firms/<slug>.json "gate") still opens on that firm's welcome screen (firm.js).

   The pages still load this file first, so it stays the one place to change that. */
(function(){
  /* the editor's unlock used to live in localStorage and last forever; it's a session cookie now (index.html) */
  try{ localStorage.removeItem('knomee-edit-token'); }catch(e){}
  /* firm.js calls this when a firm link names no known firm: the page simply shows, as the Knomee edition */
  window.ktLock=function(){};
})();
