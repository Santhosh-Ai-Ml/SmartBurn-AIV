import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);


export function createScrollAnimation({
  component,
  machine
}) {

  if (!component || !machine) {
    console.log("3D objects are not ready");
    return null;
  }


  // ======================================
  // MAIN SCROLL TIMELINE
  // ======================================

  const timeline = gsap.timeline({

    scrollTrigger: {

      trigger: ".page",

      start: "top top",

      end: "bottom bottom",

      scrub: 1,

    }

  });


  // ======================================
  // INITIAL POSITIONS
  // ======================================

  timeline.set(component.position, {

    x: 0,

    y: 0,

    z: 0

  });


  timeline.set(machine.position, {

    x: 8,

    y: 0,

    z: -2

  });


  // ======================================
  // STAGE 1
  // COMPONENT MOVES RIGHT
  // ======================================

  timeline.to(component.position, {

    x: 3,

    duration: 2,

    ease: "none"

  });


  // ======================================
  // STAGE 2
  // COMPONENT ROTATES
  // ======================================

  timeline.to(component.rotation, {

    y: Math.PI / 2,

    x: 0.5,

    duration: 1.5,

    ease: "none"

  });


  // ======================================
  // STAGE 3
  // MACHINE ENTERS THE SCENE
  // ======================================

  timeline.to(machine.position, {

    x: 4,

    duration: 2,

    ease: "none"

  });


  // ======================================
  // STAGE 4
  // COMPONENT MOVES TOWARDS MACHINE
  // ======================================

  timeline.to(component.position, {

    x: 1,

    z: -1,

    duration: 2,

    ease: "none"

  });


  // ======================================
  // STAGE 5
  // COMPONENT ENTERS MACHINE
  // ======================================

  timeline.to(component.position, {

    x: 0,

    z: -2,

    duration: 2,

    ease: "none"

  });


  // ======================================
  // STAGE 6
  // COMPONENT ROTATES
  // ======================================

  timeline.to(component.rotation, {

    y: Math.PI,

    duration: 1.5,

    ease: "none"

  });


  return timeline;
}