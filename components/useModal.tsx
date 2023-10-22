import { Input, Modal, Toast, Typography } from "@douyinfe/semi-ui";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { fileExt } from "../utils/shared";

export default function useModal() {
  const [options, setOptions] = useState({
    title: "",
    content: "",
    okType: "primary"
  });
  const [show, setShow] = useState(false);
  const inputValue = useRef("");
  const proRef = useRef(
    ({ ok = false, cancel = false, data = {} }: {
      ok?: boolean;
      cancel?: boolean;
      data?: any;
    }) => undefined
  );
  const inputRef = useRef(null);
  const checkRef = useRef<()=>boolean>(()=>true);

  const onOk = useCallback(
    function onOk() {
      try {
        proRef.current({ ok: true, data: checkRef.current() });
        setShow(false);
      } catch (error) {
        console.log('拦截确定')
      }
    },
    []
  );
  
  function onCancel() {
    proRef.current({ cancel: true });
    setShow(false);
  }

  useEffect(() => {
    const modalInputRef = document.createElement("div");
    modalInputRef.id = "modalInputRef";
    document.body.append(modalInputRef);
    const wrap = createRoot(modalInputRef);
    wrap.render(
      <Modal
        visible={show}
        title={options.title}
        okType={options.okType as any}
        onOk={onOk}
        onCancel={onCancel}
        centered
        bodyStyle={{ overflow: "auto" }}
        width={"80%"}
      >
        {options.content}
      </Modal>
    );

    setTimeout(() => {
      (inputRef.current as any)?.focus();
    });

    return () => {
      setTimeout(() => {
        modalInputRef.remove();
        wrap.unmount();
      });
    };
  }, [show, options, onOk]);

  const alert = useCallback(
    ({
      title,
      content,
      okType = "primary",
      checkCb = ()=>true,
    }: {
      title: string;
      content: any;
      okType?: string,
      checkCb?: ()=>any;
    }) => {
      inputValue.current = "";
      checkRef.current = checkCb;
      setOptions({ title, content, okType });
      setShow(true);

      return new Promise<{ ok: boolean; cancel: boolean; data: string }>(
        (resolve: any) => {
          proRef.current = resolve;
        }
      );
    },
    []
  );

  const alertInput = useCallback(
    function alertInput({
      title = "",
      content = "",
      defaultValue = "",
      emptyText = "",
    }) {
      const [name = "", ext] = fileExt(defaultValue);
      const checkCb = ()=>{
        const data = inputValue.current;
        const [name = ""] = fileExt(data);
        if (!name.trim()) {
          Toast.warning({ content: emptyText });
          throw new Error();
        }
        return data;
      }
      return alert({
        title,
        checkCb,
        content: (
          <>
            <Input
              ref={inputRef}
              defaultValue={name}
              addonAfter={ext}
              autoFocus={true}
              enterKeyHint="enter"
              onEnterPress={onOk}
              onChange={(val) => (inputValue.current = val + (ext ?? ""))}
            />
            <p style={{ width: "100%", textAlign: "center", color: "#333" }}>
              {content}
            </p>
          </>
        ),
      });
    },
    []
  );

  return {
    alertInput,
    alert,
  };
}
