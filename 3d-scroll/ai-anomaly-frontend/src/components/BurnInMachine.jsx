import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";

function BurnInMachine({
  machineRef,
  doorRef,
  heaterRef
}) {

  const { scene } = useGLTF(
    "/models/machine.glb"
  );

  useEffect(() => {

    // --------------------------------------------------
    // MODEL MATERIAL / SHADOW SETUP
    // --------------------------------------------------

    scene.traverse((child) => {

      if (child.isMesh) {

        child.castShadow = true;
        child.receiveShadow = true;

        if (child.material) {

          child.material.side = THREE.FrontSide;

          child.material.transparent = false;

          child.material.opacity = 1;

        }

      }

    });

  }, [scene]);


  return (

    <group
      ref={machineRef}

      // -----------------------------------------------
      // MACHINE ANIMATION POSITION
      // -----------------------------------------------

      position={[0, -8, -2]}

      // -----------------------------------------------
      // MODEL SCALE
      // -----------------------------------------------

      scale={[0.012, 0.012, 0.012]}

      // -----------------------------------------------
      // MODEL ROTATION
      // -----------------------------------------------

      rotation={[0, 0, 0]}
    >

      {/* =================================================
          REAL MACHINE MODEL
      ================================================= */}

      <primitive
        object={scene}
      />


      {/* =================================================
          KEEP REFS AVAILABLE
          No door animation.
      ================================================= */}

      <group
        ref={doorRef}
      />

    </group>

  );
}


// =======================================================
// PRELOAD
// =======================================================

useGLTF.preload(
  "/models/machine.glb"
);


export default BurnInMachine;