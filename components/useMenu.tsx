import { Dropdown } from "@douyinfe/semi-ui";
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

export default function useMenu() {
  const [show, setShow] = useState(false);
  const [menu, setMenu] = useState([]);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const params = useRef({});

  useEffect(() => {
    const menuWrap = document.createElement("div");
    menuWrap.id = "menuWrap";
    document.body.append(menuWrap);
    const root = createRoot(menuWrap);
    const onClickBody = () => {
      setShow(false)
    }
    root.render(
      show ? (
        <div
          style={{ left: pos.x + "px", top: pos.y + "px", position: "fixed" }}
        >
          <Dropdown
            visible
            menu={menu}
            trigger="custom"
            style={{ width: "100px" }}
            position="rightBottom"
            clickToHide={true}
            onClickOutSide={onClickBody}
          ></Dropdown>
        </div>
      ) : (
        <></>
      )
    );
    if(show) document.body.addEventListener('click', onClickBody)
    return () => {
      setTimeout(() => {
        document.body.removeChild(menuWrap);
        root.unmount();
        document.body.removeEventListener('click', onClickBody)
      });
    };
  }, [pos, menu, show]);

  const popup = (e: MouseEvent, menu: any, param: any) => {
    // console.log(e, menu);
    e.preventDefault();
    params.current = param;
    setPos({ x: e.clientX, y: e.clientY });
    setShow(true);
    return setMenu(menu);
  };

  return {
    popup,
    params,
  };
}
