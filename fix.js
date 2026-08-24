const fs=require("fs"),b="C:/Users/rdeli/OneDrive/Área de Trabalho/Revvo Projeto AP/src";function r(f){return fs.readFileSync(b+"/"+f,"utf8")}function w(f,c){fs.writeFileSync(b+"/"+f,c);console.log("OK:"+f)}function ai(f){let c=r(f);if(c.indexOf("showToast")<0){c="import { showToast } from "+String.fromCharCode(39)+"../utils/toast"+String.fromCharCode(39)+";\n"+c;w(f,c)}return r(f)}function rp(f,o,n){let c=r(f);c=c.replace(o,n);w(f,c)}
var L=[];var q=String.fromCharCode(39);var bt=String.fromCharCode(96);var lt=String.fromCharCode(60);var gt=String.fromCharCode(62);
L.push("import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "+q+"react"+q+";");
L.push("import { Toast, ToastType } from "+q+"../components/Toast"+q+";");
L.push("","interface ToastContextType {","  addToast: (type: ToastType, title: string, message?: string, duration?: number) ="+gt+" void;","  removeToast: (id: string) ="+gt+" void;","  toasts: Toast[];","}");
L.push("","const ToastContext = createContext"+lt+"ToastContextType | undefined"+gt+"(undefined);");
L.push("","export const ToastProvider = ({ children }: { children: ReactNode }) ="+gt+" {","  const [toasts, setToasts] = useState"+lt+"Toast[]"+gt+"([]);","");
L.push("  const addToast = useCallback(","    (type: ToastType, title: string, message?: string, duration?: number) ="+gt+" {");
L.push("      const id = "+q+"toast-"+q+" + Date.now() + "+q+"-"+q+" + Math.random();");
L.push("      const newToast: Toast = { id, type, title, message, duration };","      setToasts((prev) ="+gt+" [...prev, newToast]);","    },","    []","  );");
L.push("","  const removeToast = useCallback((id: string) ="+gt+" {","    setToasts((prev) ="+gt+" prev.filter((toast) ="+gt+" toast.id \!== id));","  }, []);");
L.push("","  // Listen for global toast events dispatched via showToast utility","  useEffect(() ="+gt+" {","    const handleGlobalToast = (e: Event) ="+gt+" {","      const customEvent = e as CustomEvent;");
