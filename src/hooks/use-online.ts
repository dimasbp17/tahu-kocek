import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

// true kalau perangkat sedang tersambung ke internet
export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine);
}
