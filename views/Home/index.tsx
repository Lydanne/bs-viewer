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
  Dropdown,
  Descriptions,
  Upload,
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
import {
  IconEyeClosedSolid,
  IconGithubLogo,
  IconHelpCircle,
} from "@douyinfe/semi-icons";
import {
  canvasToFile,
  fileToIOpenAttachment,
  fileToURL,
  base64ToFile,
  downloadFile,
  urlToFile,
  smartFileSizeDisplay,
  smartTimestampDisplay,
} from "../../utils/shared";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/router";
import { arrayMoveImmutable } from "array-move";
import SortableList, { SortableItem } from "react-easy-sort";
import useModal from "../../components/useModal";
import { createPortal } from "react-dom";
import useMenu from "../../components/useMenu";
import { FieldType } from "@lark-base-open/js-sdk";

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
  const [isAttachment, setIsAttachment] = useState(false);
  const [nextWin, setNextWin] = useState<Window | undefined>(undefined);
  const [t, i18n] = useTranslation();
  const { alertInput, alert } = useModal();
  const { popup, params } = useMenu();
  const uploadRef = useRef();

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
      if ((await field.getType()) !== FieldType.Attachment) {
        setIsAttachment(false);
        setLoading(false);
        return setSelected(undefined);
      }
      setIsAttachment(true);
      // const cell = await field.getCell(select.recordId);
      const urls =
        (await field
          .getAttachmentUrls(select.recordId)
          .catch((err: any) => console.log(err), [])) || [];
      const vals =
        (await field
          .getValue(select.recordId)
          .catch((err: any) => console.log(err), [])) || [];
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
      console.log(selected);

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
    i18n.changeLanguage(lang.includes("zh") ? "zh" : "en");
    console.log("check lang:", i18n, lang);
    await onSelectionChangeRef.current();
    setLoading(false);
  }, [i18n]);
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

  const saveTable = useCallback(function saveTable(selected: Selected) {
    return selected.field.setValue(
      selected.select.recordId,
      selected.selectImages.map((item: any) => item.val)
    );
  }, []);

  const clickRename = useCallback(
    async (index: number) => {
      const res = await alertInput({
        title: t("modal-title"),
        content: t("modal-content"),
        emptyText: t("modal-empty-text"),
        defaultValue: selected?.selectImages[index].val.name,
      });
      console.log(res);
      if (res.ok && res.data) {
        const newSelectImages = ([] as any).concat(selected?.selectImages);
        newSelectImages[index].val.name = res.data;
        console.log(newSelectImages === selected?.selectImages);
        const newSelected: any = { ...selected, selectImages: newSelectImages };
        saveTable(newSelected);
        setSelected(newSelected);
      }
    },
    [alertInput, selected?.selectImages]
  );

  const menu = [
    {
      node: "item",
      name: t("menu-open"),
      type: "tertiary",
      onClick() {
        if (params.current) {
          const index = (params.current as any).index;
          const img = selected?.selectImages[index];
          if (!img) {
            return;
          }
          setTimeout(() => {
            img.val.type.includes("image")
              ? openImgEditor(index)
              : Toast.warning({ content: t("no-support-file") });
          }, 1);
        }
      },
    },
    { node: "divider" },
    {
      node: "item",
      name: t("menu-rename"),
      type: "tertiary",
      onClick() {
        if (params.current) {
          clickRename((params.current as any).index);
        }
      },
    },
    {
      node: "item",
      name: t("menu-info"),
      type: "tertiary",
      onClick() {
        alert({
          title: t("menu-info"),
          content: (
            <Descriptions
              data={[
                {
                  key: t("menu-info-filename"),
                  value:
                    selected?.selectImages[(params.current as any).index].val
                      .name,
                },
                {
                  key: t("menu-info-filetype"),
                  value:
                    selected?.selectImages[(params.current as any).index].val
                      .type,
                },
                {
                  key: t("menu-info-filesize"),
                  value: smartFileSizeDisplay(
                    selected?.selectImages[(params.current as any).index].val
                      .size
                  ),
                },
                {
                  key: t("menu-info-filetime"),
                  value: smartTimestampDisplay(
                    selected?.selectImages[(params.current as any).index].val
                      .timeStamp
                  ),
                },
              ]}
            />
          ),
        });
      },
    },
    {
      node: "item",
      name: t("menu-download"),
      type: "tertiary",
      onClick() {
        if (params.current) {
          const index = (params.current as any).index;
          const img = selected?.selectImages[index];
          if (!img) {
            return;
          }
          setTimeout(async () => {
            downloadFile(await urlToFile(img.url, img.val.name, img.val.type));
          }, 1);
        }
      },
    },
    { node: "divider" },
    {
      node: "item",
      name: t("menu-delete"),
      type: "danger",
      async onClick() {
        if (params.current) {
          const index = (params.current as any).index;
          console.log(index, selected?.selectImages[index]);
          const res = await alert({
            title: t("delete-title"),
            content: t("delete-content"),
            okType: "danger",
          });
          console.log(res);
          if (res.ok) {
            const newSelectImages = ([] as any).concat(selected?.selectImages);
            newSelectImages.splice(index, 1);
            const newSelected: any = {
              ...selected,
              selectImages: newSelectImages,
            };
            saveTable(newSelected);
            setSelected(newSelected);
            Toast.success({ content: t("delete-success") });
          }
        }
      },
    },
  ];
  const customRequest = useCallback(
    async (o: any) => {
      console.log(o);
      const file = o.fileInstance;
      if (!file) {
        return;
      }
      const tid = Toast.info({
        showClose: false,
        duration: 0,
        icon: <Spin />,
        content: t("loading"),
      });
      const newSelectImage = {
        val: await fileToIOpenAttachment(base, file),
        url: await fileToURL(file),
      };
      if (!selected?.selectImages) return;
      const newSelectImages = selected.selectImages;
      newSelectImages.push(newSelectImage);
      const newSelected: any = {
        ...selected,
        selectImages: newSelectImages,
      };
      saveTable(newSelected);
      setSelected(newSelected);
      Toast.close(tid);
      Toast.success({ content: t("upload-success") + file.name });
      o.onSuccess({ status: 201 });
    },
    [saveTable, selected]
  );

  return (
    <div>
      {loading ? (
        <Spin
          size="large"
          style={{ margin: "50vh 50vw", transform: "translate(-50%, -50%)" }}
        />
      ) : !selected || !isAttachment ? (
        <Empty
          image={<IllustrationNoContent style={{ width: 150, height: 150 }} />}
          darkModeImage={
            <IllustrationNoContentDark style={{ width: 150, height: 150 }} />
          }
          description={t("empty")}
          style={{ marginTop: "20vh" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginTop: "5px",
              color: "#666",
            }}
          >
            <IconHelpCircle
              size="large"
              onClick={() => open("https://zhuanlan.zhihu.com/p/662689669")}
            />
            <IconGithubLogo
              size="large"
              style={{ marginLeft: "5px" }}
              onClick={() => open("https://github.com/WumaCoder/bs-viewer")}
            />
          </div>
        </Empty>
      ) : current === -1 ? (
        <>
          <div className={styles["block-menu"]}>
            <div>
              <Button
                size="small"
                onClick={() => (uploadRef.current as any)?.openFileDialog()}
              >
                {t("upload")}
              </Button>
            </div>
            <div className={styles["menu-item"]}>
              <Text>{t("full-mode")}</Text>
              <Switch
                size="small"
                checked={fullMode}
                onChange={setFullMode}
                aria-label="open full model"
              />
            </div>
            <div style={{flex: 1}}></div>
            <div
              className={styles["menu-item"]}
              style={{
                color: "#333",
                background: "#eee",
                marginRight: '10px'
              }}
            >
              <IconHelpCircle
                size="large"
                onClick={() => open("https://zhuanlan.zhihu.com/p/662689669")}
              />
              <IconGithubLogo
                size="large"
                style={{ marginLeft: "5px" }}
                onClick={() => open("https://github.com/WumaCoder/bs-viewer")}
              />
            </div>
          </div>
          <Upload
            style={{
              margin: "5px",
              height: selected?.selectImages.length > 0 ? "auto" : "70vh",
            }}
            action="/upload"
            ref={uploadRef as any}
            draggable={true}
            dragMainText={t("upload-drag-text")}
            dragSubText={t("upload-drag-sub")}
            // uploadTrigger="custom"
            addOnPasting
            multiple
            showUploadList={false}
            customRequest={customRequest}
          >
            {selected?.selectImages.length > 0 ? (
              <div
                style={{ width: "100%" }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <SortableList
                  onSortEnd={onSortEnd}
                  draggedItemClassName="dragged"
                  className={styles["block-image"]}
                >
                  {selected?.selectImages?.map((img, index) => {
                    return (
                      <SortableItem key={img.val.token}>
                        {
                          <div
                            className={styles["image-item"]}
                            style={{ background: "#eee" }}
                            onClick={() =>
                              img.val.type.includes("image")
                                ? openImgEditor(index)
                                : Toast.warning({
                                    content: t("no-support-file"),
                                  })
                            }
                            onContextMenu={(e) => {
                              popup(e as unknown as MouseEvent, menu, {
                                index,
                              });
                            }}
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
                              onDoubleClickCapture={() => clickRename(index)}
                            >
                              {img.val.name}
                            </Text>
                          </div>
                        }
                      </SortableItem>
                    );
                  })}
                </SortableList>
              </div>
            ) : undefined}
          </Upload>
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
    </div>
  );
}
