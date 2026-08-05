import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import anime from 'animejs';
import * as THREE from 'three';
import confetti from 'canvas-confetti';

window.Lenis = Lenis;
window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;
window.anime = anime;
window.THREE = THREE;
window.confetti = confetti;

// Register ScrollTrigger immediately
gsap.registerPlugin(ScrollTrigger);
