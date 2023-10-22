"use client";
import {
  Col,
  Image,
  Row,
  Spin,
  Empty,
  Badge,
  Toast,
  Switch,
  Typography,
  Button,
} from "@douyinfe/semi-ui";
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
  IllustrationConstruction,
  IllustrationConstructionDark,
} from "@douyinfe/semi-illustrations";

import styles from "./index.module.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { IconEyeClosedSolid, IconGithubLogo, IconHelpCircle } from "@douyinfe/semi-icons";
import {
  canvasToFile,
  fileToIOpenAttachment,
  fileToURL,
  base64ToFile,
  downloadFile,
} from "../../utils/shared";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { arrayMoveImmutable } from "array-move";
import SortableList, { SortableItem } from "react-easy-sort";
import useModalInput from "../../components/useModalInput";
import { createPortal } from "react-dom";

const Editor = dynamic(() => import("../../components/Editor"), { ssr: false });

let base: any = null;
let bridge: any = null;
let table: any = null;
let lang: string = "zh";
let inited = false;

type Selected = {
  field: any;
  select: any;
  selectImages: { val: any; url: any }[];
};

if (typeof window !== "undefined") {
  window.devicePixelRatio = window.devicePixelRatio * 4;
}

const storeFullMode =
  typeof localStorage !== "undefined"
    ? localStorage.getItem("fullMode") === "1"
    : false;

export default function Home() {
  const { Text } = Typography;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(-1);
  const [fullMode, setFullMode] = useState(storeFullMode);
  const [selected, setSelected] = useState<Selected | undefined>(undefined);
  const [nextWin, setNextWin] = useState<Window | undefined>(undefined);
  const [t, i18n] = useTranslation();
  const { alert } = useModalInput();
  // const lock = useRef(false);

  useEffect(() => {
    localStorage.setItem("fullMode", fullMode ? "1" : "0");
  }, [fullMode]);

  const onSelectChange = useCallback(async () => {
    setLoading(true);
    // lock.current = true;
    try {
      const selected: Selected = {
        field: null,
        select: null,
        selectImages: [],
      };
      const select = await base.getSelection();
      const field: any = await table.getField(select.fieldId);
      // const cell = await field.getCell(select.recordId);
      const urls = await field.getAttachmentUrls(select.recordId);
      const vals = await field.getValue(select.recordId);
      selected.field = field;
      selected.select = select;
      vals.map((val: any, i: string | number) => {
        selected.selectImages.push({
          val,
          url: urls[i],
        });
      });
      if (current > selected.selectImages.length - 1) {
        setCurrent(-1);
      }
      setSelected(selected);
    } catch (error) {
      setSelected(undefined);
      console.error(error);
    }
    setLoading(false);
  }, [current]);
  const onSelectionChangeRef = useRef(onSelectChange);
  onSelectionChangeRef.current = onSelectChange;

  const init = useCallback(async () => {
    if (inited) {
      return;
    }
    inited = true;
    // setLoading(true);
    const { bitable } = await import("@lark-base-open/js-sdk");
    table = await bitable.base.getActiveTable();
    base = (table as any).base;
    bridge = (bitable as any).bridge;
    base.onSelectionChange(() => onSelectionChangeRef.current());
    lang = await bridge.getLanguage();
    // i18n.changeLanguage(lang);
    await onSelectionChangeRef.current();
    setLoading(false);
  }, []);
  useEffect(() => {
    init();
  });

  const openImgEditor = useCallback(
    async (index: number) => {
      if (!selected) {
        return;
      }
      if (!fullMode) {
        return setCurrent(index);
      }
      if (!window) {
        return setCurrent(index);
      }
      const nextWin = window.open(`/editor`, "_blank", "fullscreen=yes") as any;
      if (!nextWin) {
        return;
      }
      setCurrent(index);
      const selectImage = selected.selectImages[index];
      nextWin.bridge = {
        getOptions: () => {
          return {
            source: selectImage.url,
            defaultSavedImageName: selectImage?.val?.name,
            onSave: async (editedImageObject: any, designState: any) => {
              console.log(editedImageObject, designState);
              await saveImgEditor(editedImageObject as any, designState, index);
              nextWin.close();
            },
            onClose: () => {
              closeImgEditor();
              nextWin.close();
            },
          };
        },
      };
      nextWin.addEventListener("unload", () => {
        if (nextWin.isLoaded) {
          closeImgEditor();
        }
      });
      setNextWin(nextWin);
    },
    [selected, fullMode]
  );

  const closeImgEditor = useCallback(() => {
    setCurrent(-1);
  }, []);

  const saveImgEditor = async (
    {
      imageCanvas,
      fullName,
      mimeType,
      imageBase64,
    }: {
      imageBase64: string;
      imageCanvas: HTMLCanvasElement;
      fullName: string;
      mimeType: string;
    },
    imageDesignState: any,
    index: number = current
  ) => {
    const file = await canvasToFile(imageCanvas, fullName, mimeType);
    // console.log(file);
    // const file = await base64ToFile(imageBase64, fullName, mimeType);
    // downloadFile(file);
    if (!selected?.selectImages) {
      throw new Error();
    }
    const newSelectImages = ([] as any).concat(selected.selectImages);
    newSelectImages[index] = {
      val: await fileToIOpenAttachment(base, file),
      url: await fileToURL(file),
    };

    // console.log(newSelectImages, index);

    const newSelected = { ...selected, selectImages: newSelectImages };
    saveTable(newSelected);
    setSelected(newSelected);
    setCurrent(-1);
    Toast.success({ content: t("save-success") });
  };

  const onSortEnd = (oldIndex: number, newIndex: number) => {
    // console.log("setSelected", oldIndex, newIndex);
    setSelected((selected) => {
      if (selected) {
        const newSelected = {
          ...selected,
          selectImages: arrayMoveImmutable(
            selected.selectImages,
            oldIndex,
            newIndex
          ),
        };
        saveTable(newSelected);
        return newSelected;
      }
      return selected;
    });
  };

  // useEffect(()=>{
  //   if(!selected){
  //     return;
  //   }
  //   if(lock.current){
  //     lock.current = false;
  //     return;
  //   }
  //   console.log('更新对象', selected)
  //   selected.field.setValue(
  //     selected.select.recordId,
  //     selected.selectImages.map((item: any) => item.val)
  //   );
  // }, [selected?.selectImages])

  const saveTable = useCallback(function saveTable(selected: Selected) {
    return selected.field.setValue(
      selected.select.recordId,
      selected.selectImages.map((item: any) => item.val)
    );
  }, []);

  const onCaptureTitle = useCallback(
    async (index: number) => {
      const res = await alert({
        title: t("modal-title"),
        content: t("modal-content"),
        emptyText: t("modal-empty-text"),
        defaultValue: selected?.selectImages[index].val.name,
      });
      console.log(res);
      if (res.ok) {
        const newSelectImages = ([] as any).concat(selected?.selectImages);
        newSelectImages[index].val.name = res.data;
        console.log(newSelectImages === selected?.selectImages);
        const newSelected: any = { ...selected, selectImages: newSelectImages };
        saveTable(newSelected);
        setSelected(newSelected);
      }
    },
    [alert, selected?.selectImages]
  );
  return (
    <div>
      {loading ? (
        <Spin
          size="large"
          style={{ margin: "50vh 50vw", transform: "translate(-50%, -50%)" }}
        />
      ) : !selected ? (
        <Empty
          image={<IllustrationNoContent style={{ width: 150, height: 150 }} />}
          darkModeImage={
            <IllustrationNoContentDark style={{ width: 150, height: 150 }} />
          }
          description={t("empty")}
          style={{ marginTop: "20vh" }}
        />
      ) : current === -1 ? (
        <>
          <div className={styles["block-menu"]}>
            <div className={styles["menu-item"]}>
              <Text>{t("full-mode")}</Text>
              <Switch
                size="small"
                checked={fullMode}
                onChange={setFullMode}
                aria-label="open full model"
              />
            </div>
          </div>
          <SortableList
            onSortEnd={onSortEnd}
            draggedItemClassName="dragged"
            className={styles["block-image"]}
          >
            {selected?.selectImages?.map((img, index) => {
              return (
                <SortableItem key={img.url}>
                  {
                    <div
                      className={styles["image-item"]}
                      style={{ background: "#eee" }}
                      key={img.url}
                      onClick={() =>
                        img.val.type.includes("image")
                          ? openImgEditor(index)
                          : Toast.warning({ content: t("no-support-file") })
                      }
                    >
                      <img
                        className={styles["image"]}
                        src={
                          img.val.type.includes("image")
                            ? img.url
                            : "/no-image.svg"
                        }
                        alt={img.val.name}
                        style={{ width: "100%", height: "100%" }}
                      />
                      <Text
                        ellipsis={true}
                        className={styles["title"]}
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        onDoubleClickCapture={() => onCaptureTitle(index)}
                      >
                        {img.val.name}
                      </Text>{" "}
                    </div>
                  }
                </SortableItem>
              );
            })}
          </SortableList>
          <div className={styles["image-tip"]}>{t("image-tip")}</div>
        </>
      ) : fullMode ? (
        <div>
          <Empty
            image={
              <IllustrationConstruction style={{ width: 150, height: 150 }} />
            }
            darkModeImage={
              <IllustrationConstructionDark
                style={{ width: 150, height: 150 }}
              />
            }
            description={t("editing")}
            style={{ marginTop: "20vh" }}
          >
            <div>
              <Button
                style={{ padding: "6px 24px", marginRight: 12 }}
                type="primary"
                onClick={nextWin?.close?.bind(nextWin)}
              >
                {t("back-list")}
              </Button>
              <Button
                style={{ padding: "6px 24px" }}
                theme="solid"
                type="primary"
                onClick={nextWin?.focus?.bind(nextWin)}
              >
                {t("back-edit")}
              </Button>
            </div>
          </Empty>
        </div>
      ) : (
        <div style={{ height: "100vh" }}>
          <Editor
            source={selected.selectImages[current].url}
            defaultSavedImageName={selected.selectImages[current]?.val?.name}
            onSave={saveImgEditor}
            onClose={closeImgEditor}
          />
        </div>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: '5px',
          color: "#666"
        }}
      >
        <IconHelpCircle size="large" onClick={()=>open('https://zhuanlan.zhihu.com/p/662689669')} />
        <IconGithubLogo size="large" style={{marginLeft: '5px'}} onClick={()=>open('https://github.com/WumaCoder/bs-viewer')} />
      </div>
    </div>
  );
}
