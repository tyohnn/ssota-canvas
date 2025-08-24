"use client";

import React from "react";
import type { EditorField } from "@/domains/canvas/policy/block-editor-policy";
import type { Block } from "@/db/schema";
import { getValue } from "../object-path";
import { useBlockPropertyUpdate } from "../useBlockPropertyUpdate";

export function HiddenProperty({
  block,
  field,
}: {
  block: Block;
  field: EditorField;
}) {
  const { updateMetadata } = useBlockPropertyUpdate(block);
  const value = getValue(block?.metadata || {}, field.path);

  // Hidden 필드는 UI에 표시되지 않지만 값은 저장됩니다
  // 필요한 경우 프로그래밍적으로 값을 설정할 수 있습니다
  React.useEffect(() => {
    // 기본값이 설정되어 있지 않다면 설정
    if (value === undefined && field.placeholder) {
      updateMetadata(field.path, field.placeholder);
    }
  }, [field.path, field.placeholder, updateMetadata, value]);

  // UI에는 아무것도 렌더링하지 않음
  return null;
}
