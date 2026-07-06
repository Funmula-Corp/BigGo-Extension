import { HISTORY_CHANGE_EVENT } from "@/content/constant"

;(() => {
  if(!window.__biggo_set_history_listener_flag) {
    ;(function(history){
      // patch pushState 只為發 postMessage 路由變更訊號讓 UI 重建，不改導航目標
      const pushState = history.pushState;
      history.pushState = function(state) {
        if (typeof history.onpushstate =="function") {
          try {
            history.onpushstate({state: state});
          }catch(e){}
        }
        return pushState.apply(history, arguments);
      }

      const popState = window.onpopstate;
      window.onpopstate = function(e) {
        if(typeof window._onpopstate == "function") {
          try {
            window._onpopstate(e)
          }catch(e){}
          return popState.apply(window, arguments)
        }
      }
    })(window.history);

    window.__biggo_set_history_listener_flag = true;

    const handle = function() {
      window.postMessage(HISTORY_CHANGE_EVENT, "*");
    }
    window.history.onpushstate = handle
    window._onpopstate = handle
  }
})()