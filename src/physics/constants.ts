/** 
 * Some usefull physics constants
 * We won't use most of these, but 
 * they are still here regardless.
 **/
export class Constants {
  static readonly SPEED_OF_LIGHT: number = 3.00e8; // m/s
  static readonly GRAVITATIONAL_CONSTANT: number = 6.674e-11; // N·m²/kg²
  static readonly ACCELERATION_DUE_TO_GRAVITY: number = -9.81; // m/s²
  static readonly PLANCK_CONSTANT: number = 6.626e-34; // J·s
  static readonly ELEMENTARY_CHARGE: number = 1.602e-19; // C
  static readonly PERMITTIVITY_OF_FREE_SPACE: number = 8.85e-12; // C²/N·m²
  static readonly PERMEABILITY_OF_FREE_SPACE: number = 4 * Math.PI * 1e-7; // T·m/A
  static readonly AVOGADRO_CONSTANT: number = 6.022e23; // mol⁻¹
  static readonly BOLTZMANN_CONSTANT: number = 1.38e-23; // J/K
  static readonly UNIVERSAL_GAS_CONSTANT: number = 8.314; // J/(mol·K)
  static readonly COULOMB_CONSTANT: number = 8.99e9; // N·m²/C²
  static readonly ELECTRON_MASS: number = 9.11e-31; // kg
  static readonly PROTON_MASS: number = 1.67e-27; // kg
  static readonly NEUTRON_MASS: number = 1.675e-27; // kg
  static readonly ELECTRON_VOLT: number = 1.602e-19; // J
  static readonly STEFAN_BOLTZMANN_CONSTANT: number = 5.67e-8; // W/m²·K⁴
  static readonly WIEN_DISPLACEMENT_CONSTANT: number = 2.898e-3; // m·K
  static readonly FINE_STRUCTURE_CONSTANT: number = 1 / 137;
}
