import { useGLTF } from "@react-three/drei";

function ElectronicComponent({ componentRef }) {

  const { scene } = useGLTF(
    "/models/component.glb"
  );

  return (
    <primitive
      ref={componentRef}
      object={scene}
      scale={1}
      position={[0, 0, 0]}
    />
  );
}

useGLTF.preload(
  "/models/component.glb"
);

export default ElectronicComponent;