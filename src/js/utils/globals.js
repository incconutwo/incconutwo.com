import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import confetti from 'canvas-confetti';

window.Lenis = Lenis;
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
window.THREE = THREE;
window.confetti = confetti;

// Register ScrollTrigger immediately
gsap.registerPlugin(ScrollTrigger);
