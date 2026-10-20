// Order here is the order on the page.
import type { Experiment } from "./kit";
import { toppings } from "./toppings";
import { sauce } from "./sauce";
import { dough } from "./dough";
import { halftone } from "./halftone";
import { kinetic } from "./type";

export const EXPERIMENTS: Experiment[] = [toppings, sauce, dough, halftone, kinetic];
