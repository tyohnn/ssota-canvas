import type { Block } from '@/db/schema';
import type { DefaultMetadata, FormSchema } from '@/domains/blocks/types';
import type { OverrideFlags } from './component-override.types';

// Component Definition - template that defines the style and schema
export type ComponentDefinitionData = {
  componentKey?: string;
  description?: string;
  connectedInstanceIds?: string[];
};

export type ComponentDefinitionMetadata = DefaultMetadata & {
  role: 'definition';
  componentData: ComponentDefinitionData;
};

export type ComponentDefinition = Block & {
  object: 'component';
  metadata: ComponentDefinitionMetadata;
};

export type ComponentInstanceData = {
  componentId: string;
  overrides: OverrideFlags;
};

export type ComponentInstanceMetadata = DefaultMetadata & {
  role: 'instance';
  instanceData: ComponentInstanceData;
};

export type ComponentInstance = Block & {
  object: 'block'; // 일반 블록과 동일하게 유지
  metadata: ComponentInstanceMetadata;
};

// Union type for component metadata
export type ComponentMetadata =
  | ComponentDefinitionMetadata
  | ComponentInstanceMetadata;

// Type guards
export function isComponentDefinition(
  block: Block
): block is ComponentDefinition {
  const metadata = block.metadata as ComponentMetadata;
  return block.object === 'component' && metadata?.role === 'definition';
}

export function isComponentInstance(block: Block): block is ComponentInstance {
  const metadata = block.metadata as ComponentMetadata;
  return (
    block.object === 'block' && // 일반 블록과 동일
    metadata?.role === 'instance' &&
    metadata?.instanceData &&
    typeof (metadata.instanceData as any)?.componentId === 'string'
  );
}

// ============================================================================
// 가상 데이터 예시 (주석 처리)
// ============================================================================

/*
// Component Definition 가상 데이터 예시
const sampleComponentDefinition: ComponentDefinition = {
  id: "comp-def-001",
  object: "component",
  metadata: {
    role: "definition",
    componentData: {
      componentKey: "button-primary",
      description: "Primary button component with consistent styling"
    },
    nodeUI: {
      size: { width: 120, height: 40 }
    },
    formSchema: {
      fields: [
        {
          id: "text",
          label: "Button Text",
          type: "text",
          placeholder: "Enter button text",
          validation: { required: true, maxLength: 50 }
        },
        {
          id: "color",
          label: "Button Color",
          type: "color",
          default: "#007bff"
        }
      ]
    },
    formData: {
      text: "Click me",
      color: "#007bff"
    }
  }
};

// Component Instance 가상 데이터 예시
const sampleComponentInstance: ComponentInstance = {
  id: "comp-inst-001",
  object: "block",
  metadata: {
    role: "instance",
    instanceData: {
      componentId: "comp-def-001",
      overrides: {
        nodeUI: ["size"],
        formData: ["text"],
        formSchema: []
      }
    },
    component_id: "comp-def-001", // 참조하는 component definition의 ID
    nodeUI: {
      size: { width: 150, height: 45 } // 오버라이드된 크기
    },
    formSchema: {
      fields: [
        {
          id: "text",
          label: "Button Text",
          type: "text",
          placeholder: "Enter button text",
          validation: { required: true, maxLength: 50 }
        },
        {
          id: "color",
          label: "Button Color",
          type: "color",
          default: "#007bff"
        }
      ]
    },
    formData: {
      text: "Custom Button", // 오버라이드된 텍스트
      color: "#007bff"
    }
  }
};

// 복잡한 컴포넌트 정의 예시 (카드 컴포넌트)
const cardComponentDefinition: ComponentDefinition = {
  id: "comp-def-002",
  object: "component",
  metadata: {
    role: "definition",
    componentData: {
      componentKey: "card-standard",
      description: "Standard card component with header, content, and footer"
    },
    nodeUI: {
      size: { width: 300, height: 200 }
    },
    formSchema: {
      fields: [
        {
          id: "title",
          label: "Card Title",
          type: "text",
          validation: { required: true, maxLength: 100 }
        },
        {
          id: "content",
          label: "Card Content",
          type: "text",
          validation: { maxLength: 500 }
        },
        {
          id: "imageUrl",
          label: "Image URL",
          type: "url"
        },
        {
          id: "showFooter",
          label: "Show Footer",
          type: "checkbox",
          default: true
        },
        {
          id: "footerText",
          label: "Footer Text",
          type: "text",
          validation: { maxLength: 200 }
        }
      ]
    },
    formData: {
      title: "Card Title",
      content: "This is the card content",
      imageUrl: "",
      showFooter: true,
      footerText: "Card footer"
    }
  }
};

// 카드 컴포넌트 인스턴스 예시 (일부 오버라이드)
const cardComponentInstance: ComponentInstance = {
  id: "comp-inst-002",
  object: "block",
  metadata: {
    role: "instance",
    instanceData: {
      componentId: "comp-def-002",
      overrides: {
        nodeUI: ["size"],
        formData: ["title", "content"],
        formSchema: []
      }
    },
    component_id: "comp-def-002",
    nodeUI: {
      size: { width: 350, height: 250 } // 더 큰 크기로 오버라이드
    },
    formSchema: {
      fields: [
        {
          id: "title",
          label: "Card Title",
          type: "text",
          validation: { required: true, maxLength: 100 }
        },
        {
          id: "content",
          label: "Card Content",
          type: "text",
          validation: { maxLength: 500 }
        },
        {
          id: "imageUrl",
          label: "Image URL",
          type: "url"
        },
        {
          id: "showFooter",
          label: "Show Footer",
          type: "checkbox",
          default: true
        },
        {
          id: "footerText",
          label: "Footer Text",
          type: "text",
          validation: { maxLength: 200 }
        }
      ]
    },
    formData: {
      title: "Welcome Card", // 오버라이드된 제목
      content: "Welcome to our platform! This is a customized card instance.", // 오버라이드된 내용
      imageUrl: "",
      showFooter: true,
      footerText: "Card footer"
    }
  }
};
*/
