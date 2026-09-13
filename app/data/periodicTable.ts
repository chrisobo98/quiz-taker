export type ElementCategory = 'alkali' | 'alkaline' | 'transition' | 'post-transition' | 'metalloid' | 'nonmetal' | 'halogen' | 'noble' | 'lanthanide' | 'actinide'

export type ChemicalElement = {
  atomicNumber: number
  symbol: string
  name: string
  atomicMass: string
  period: number
  group: number
  displayRow?: number
  category: ElementCategory
}

type ElementTuple = [number, string, string, string, number, number, ElementCategory, number?]

// Conventional abridged values suitable for the course reference table. Bracketed
// values identify the mass number used for elements without a standard atomic weight.
const rows: ElementTuple[] = [
  [1,'H','Hydrogen','1.008',1,1,'nonmetal'],[2,'He','Helium','4.0026',1,18,'noble'],
  [3,'Li','Lithium','6.94',2,1,'alkali'],[4,'Be','Beryllium','9.0122',2,2,'alkaline'],[5,'B','Boron','10.81',2,13,'metalloid'],[6,'C','Carbon','12.011',2,14,'nonmetal'],[7,'N','Nitrogen','14.007',2,15,'nonmetal'],[8,'O','Oxygen','15.999',2,16,'nonmetal'],[9,'F','Fluorine','18.998',2,17,'halogen'],[10,'Ne','Neon','20.180',2,18,'noble'],
  [11,'Na','Sodium','22.990',3,1,'alkali'],[12,'Mg','Magnesium','24.305',3,2,'alkaline'],[13,'Al','Aluminum','26.982',3,13,'post-transition'],[14,'Si','Silicon','28.085',3,14,'metalloid'],[15,'P','Phosphorus','30.974',3,15,'nonmetal'],[16,'S','Sulfur','32.06',3,16,'nonmetal'],[17,'Cl','Chlorine','35.45',3,17,'halogen'],[18,'Ar','Argon','39.95',3,18,'noble'],
  [19,'K','Potassium','39.098',4,1,'alkali'],[20,'Ca','Calcium','40.078',4,2,'alkaline'],[21,'Sc','Scandium','44.956',4,3,'transition'],[22,'Ti','Titanium','47.867',4,4,'transition'],[23,'V','Vanadium','50.942',4,5,'transition'],[24,'Cr','Chromium','51.996',4,6,'transition'],[25,'Mn','Manganese','54.938',4,7,'transition'],[26,'Fe','Iron','55.845',4,8,'transition'],[27,'Co','Cobalt','58.933',4,9,'transition'],[28,'Ni','Nickel','58.693',4,10,'transition'],[29,'Cu','Copper','63.546',4,11,'transition'],[30,'Zn','Zinc','65.38',4,12,'transition'],[31,'Ga','Gallium','69.723',4,13,'post-transition'],[32,'Ge','Germanium','72.630',4,14,'metalloid'],[33,'As','Arsenic','74.922',4,15,'metalloid'],[34,'Se','Selenium','78.971',4,16,'nonmetal'],[35,'Br','Bromine','79.904',4,17,'halogen'],[36,'Kr','Krypton','83.798',4,18,'noble'],
  [37,'Rb','Rubidium','85.468',5,1,'alkali'],[38,'Sr','Strontium','87.62',5,2,'alkaline'],[39,'Y','Yttrium','88.906',5,3,'transition'],[40,'Zr','Zirconium','91.224',5,4,'transition'],[41,'Nb','Niobium','92.906',5,5,'transition'],[42,'Mo','Molybdenum','95.95',5,6,'transition'],[43,'Tc','Technetium','[97]',5,7,'transition'],[44,'Ru','Ruthenium','101.07',5,8,'transition'],[45,'Rh','Rhodium','102.91',5,9,'transition'],[46,'Pd','Palladium','106.42',5,10,'transition'],[47,'Ag','Silver','107.87',5,11,'transition'],[48,'Cd','Cadmium','112.41',5,12,'transition'],[49,'In','Indium','114.82',5,13,'post-transition'],[50,'Sn','Tin','118.71',5,14,'post-transition'],[51,'Sb','Antimony','121.76',5,15,'metalloid'],[52,'Te','Tellurium','127.60',5,16,'metalloid'],[53,'I','Iodine','126.90',5,17,'halogen'],[54,'Xe','Xenon','131.29',5,18,'noble'],
  [55,'Cs','Cesium','132.91',6,1,'alkali'],[56,'Ba','Barium','137.33',6,2,'alkaline'],[57,'La','Lanthanum','138.91',6,3,'lanthanide'],[72,'Hf','Hafnium','178.49',6,4,'transition'],[73,'Ta','Tantalum','180.95',6,5,'transition'],[74,'W','Tungsten','183.84',6,6,'transition'],[75,'Re','Rhenium','186.21',6,7,'transition'],[76,'Os','Osmium','190.23',6,8,'transition'],[77,'Ir','Iridium','192.22',6,9,'transition'],[78,'Pt','Platinum','195.08',6,10,'transition'],[79,'Au','Gold','196.97',6,11,'transition'],[80,'Hg','Mercury','200.59',6,12,'transition'],[81,'Tl','Thallium','204.38',6,13,'post-transition'],[82,'Pb','Lead','207.2',6,14,'post-transition'],[83,'Bi','Bismuth','208.98',6,15,'post-transition'],[84,'Po','Polonium','[209]',6,16,'post-transition'],[85,'At','Astatine','[210]',6,17,'halogen'],[86,'Rn','Radon','[222]',6,18,'noble'],
  [87,'Fr','Francium','[223]',7,1,'alkali'],[88,'Ra','Radium','[226]',7,2,'alkaline'],[89,'Ac','Actinium','[227]',7,3,'actinide'],[104,'Rf','Rutherfordium','[267]',7,4,'transition'],[105,'Db','Dubnium','[268]',7,5,'transition'],[106,'Sg','Seaborgium','[269]',7,6,'transition'],[107,'Bh','Bohrium','[270]',7,7,'transition'],[108,'Hs','Hassium','[269]',7,8,'transition'],[109,'Mt','Meitnerium','[277]',7,9,'transition'],[110,'Ds','Darmstadtium','[281]',7,10,'transition'],[111,'Rg','Roentgenium','[282]',7,11,'transition'],[112,'Cn','Copernicium','[285]',7,12,'transition'],[113,'Nh','Nihonium','[286]',7,13,'post-transition'],[114,'Fl','Flerovium','[290]',7,14,'post-transition'],[115,'Mc','Moscovium','[290]',7,15,'post-transition'],[116,'Lv','Livermorium','[293]',7,16,'post-transition'],[117,'Ts','Tennessine','[294]',7,17,'halogen'],[118,'Og','Oganesson','[294]',7,18,'noble'],
  [58,'Ce','Cerium','140.12',6,4,'lanthanide',9],[59,'Pr','Praseodymium','140.91',6,5,'lanthanide',9],[60,'Nd','Neodymium','144.24',6,6,'lanthanide',9],[61,'Pm','Promethium','[145]',6,7,'lanthanide',9],[62,'Sm','Samarium','150.36',6,8,'lanthanide',9],[63,'Eu','Europium','151.96',6,9,'lanthanide',9],[64,'Gd','Gadolinium','157.25',6,10,'lanthanide',9],[65,'Tb','Terbium','158.93',6,11,'lanthanide',9],[66,'Dy','Dysprosium','162.50',6,12,'lanthanide',9],[67,'Ho','Holmium','164.93',6,13,'lanthanide',9],[68,'Er','Erbium','167.26',6,14,'lanthanide',9],[69,'Tm','Thulium','168.93',6,15,'lanthanide',9],[70,'Yb','Ytterbium','173.05',6,16,'lanthanide',9],[71,'Lu','Lutetium','174.97',6,17,'lanthanide',9],
  [90,'Th','Thorium','232.04',7,4,'actinide',10],[91,'Pa','Protactinium','231.04',7,5,'actinide',10],[92,'U','Uranium','238.03',7,6,'actinide',10],[93,'Np','Neptunium','[237]',7,7,'actinide',10],[94,'Pu','Plutonium','[244]',7,8,'actinide',10],[95,'Am','Americium','[243]',7,9,'actinide',10],[96,'Cm','Curium','[247]',7,10,'actinide',10],[97,'Bk','Berkelium','[247]',7,11,'actinide',10],[98,'Cf','Californium','[251]',7,12,'actinide',10],[99,'Es','Einsteinium','[252]',7,13,'actinide',10],[100,'Fm','Fermium','[257]',7,14,'actinide',10],[101,'Md','Mendelevium','[258]',7,15,'actinide',10],[102,'No','Nobelium','[259]',7,16,'actinide',10],[103,'Lr','Lawrencium','[262]',7,17,'actinide',10],
]

export const periodicTable: ChemicalElement[] = rows
  .map(([atomicNumber, symbol, name, atomicMass, period, group, category, displayRow]) => ({ atomicNumber, symbol, name, atomicMass, period, group, category, displayRow }))
  .sort((a, b) => a.atomicNumber - b.atomicNumber)

export const elementCategories: Array<{ id: ElementCategory; label: string }> = [
  { id: 'alkali', label: 'Alkali metal' }, { id: 'alkaline', label: 'Alkaline earth' },
  { id: 'transition', label: 'Transition metal' }, { id: 'post-transition', label: 'Post-transition' },
  { id: 'metalloid', label: 'Metalloid' }, { id: 'nonmetal', label: 'Nonmetal' },
  { id: 'halogen', label: 'Halogen' }, { id: 'noble', label: 'Noble gas' },
  { id: 'lanthanide', label: 'Lanthanide' }, { id: 'actinide', label: 'Actinide' },
]
