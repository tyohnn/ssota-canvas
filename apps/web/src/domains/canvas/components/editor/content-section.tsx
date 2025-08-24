"use client";

import React from "react";
import { Editor, rootCtx } from "@milkdown/kit/core";
import { commonmark } from "@milkdown/kit/preset/commonmark";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { nord } from "@milkdown/theme-nord";
// import "@milkdown/theme-nord/style.css";
import { block, BlockProvider } from "@milkdown/kit/plugin/block";

const MilkdownEditor: React.FC = () => {
  const blockPluginView = (ctx: any) => (view: any) => {
    const provider = new BlockProvider({
      ctx,
      content: view.dom as HTMLElement,
    });

    return {
      update: (updatedView: any, prevState?: any) => {
        (provider as any).update(updatedView, prevState);
      },
      destroy: () => {
        provider.destroy();
      },
    };
  };

  useEditor((root) =>
    Editor.make()
      .config(nord)
      .config((ctx) => {
        ctx.set(rootCtx, root);
        // Bind block view
        // https://milkdown.dev/docs/api/plugin-block
         
        (ctx as any).set(block.key, {
          view: blockPluginView(ctx),
        });
      })
      .use(commonmark)
      .use(block)
  );

  return <Milkdown />;
};

export const ContentSection: React.FC = () => {
  return (
    <div className="p-4">
      <MilkdownProvider>
        <div className="rounded-md border border-border overflow-hidden">
          <MilkdownEditor />
        </div>
      </MilkdownProvider>
    </div>
  );
};
