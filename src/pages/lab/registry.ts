// Order here is the order on the page (Exp. 01 .. 08).
import type { Experiment } from "./kit";
import { toppings } from "./toppings";
import { sauce } from "./sauce";
import { dough } from "./dough";
import { halftone } from "./halftone";
import { clock } from "./clock";
import { kinetic } from "./type";
import { printer } from "./printer";
import { cheese } from "./cheese";

export const EXPERIMENTS: Experiment[] = [toppings, sauce, dough, halftone, clock, kinetic, printer, cheese];
