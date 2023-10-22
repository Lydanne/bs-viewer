import { Input, Modal, Typography } from "@douyinfe/semi-ui";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { fileExt } from "../utils/shared";


export default function useModalInput() {
  const [options, setOptions] = useState({title: "", content: "", defaultValue: ""});
  const [show, setShow] = useState(false);
  const inputValue = useRef("");
  const proRef = useRef(({ ok = false, cancel = false, data = "" }) => undefined);
  
  const onOk = useCallback(function onOk() {
    proRef.current({ ok: true, data: inputValue.current });
    setShow(false);
  }, [])

  function onCancel() {
    proRef.current({ cancel: true });
    setShow(false);
  }

  useEffect(() => {
    const modalInputRef = document.createElement("div");
    modalInputRef.id = "modalInputRef";
    document.body.append(modalInputRef);
    const wrap = createRoot(modalInputRef);
    const [name = "", ext] = fileExt(options.defaultValue)
    wrap.render(
      <Modal
        visible={show}
        title={options.title}
        onOk={onOk}
        onCancel={onCancel}
        centered
        bodyStyle={{ overflow: "auto"}}
        width={'80%'}
      >
        <Input defaultValue={name} addonAfter={ext} autoFocus={true} onChange={val => inputValue.current = (val + (ext ?? ''))} />
        <p style={{width: '100%', textAlign: 'center', color: '#333'}}>{options.content}</p>
      </Modal>
    );
    return () => {
      setTimeout(()=>{
        modalInputRef.remove();
        wrap.unmount();
      })
    };
  }, [show, options, onOk]);

  const alert = useCallback(function alert({ title = "", content ="", defaultValue="" }) {
    setOptions({title, content, defaultValue});
    setShow(true);
    return new Promise<{ok:boolean, cancel: boolean, data: string}>((resolve: any) => {
      proRef.current = resolve;
    });
  }, [])
  return {
    alert,
  };
}
