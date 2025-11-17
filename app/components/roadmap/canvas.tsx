import { ReactFlow, type ReactFlowProps } from "@xyflow/react";
import type { ReactNode } from "react";
import "@xyflow/react/dist/style.css";
import { Controls } from "../ai-elements/controls";

type CanvasProps = ReactFlowProps & {
  children?: ReactNode;
};

export const Canvas = ({ children, ...props }: CanvasProps) => {
  const { style: incomingStyle, ...rest } = props as any
  const style = { background: "var(--sidebar)", height: "100%", ...(incomingStyle || {}) }

  return (
    <ReactFlow
      deleteKeyCode={["Backspace", "Delete"]}
      fitView
      panOnDrag={false}
      panOnScroll
      selectionOnDrag={true}
      zoomOnDoubleClick={false}
      style={style}
      {...rest}
    >
      <Controls />
      {children}
    </ReactFlow>
  )
}
