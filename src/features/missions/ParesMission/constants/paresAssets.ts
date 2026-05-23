import { Image, ImageSourcePropType } from 'react-native';
import { PairCardAsset } from '../types/paresMission.types';

export const PAIR_CARD_ASSETS: PairCardAsset[] = [
  { id: 'arbol', name: 'Arbol', source: require('../../../../../assets/pares/arbol.webp') as ImageSourcePropType },
  { id: 'astronauta', name: 'Astronauta', source: require('../../../../../assets/pares/astronauta.webp') as ImageSourcePropType },
  { id: 'avion', name: 'Avion', source: require('../../../../../assets/pares/avion.webp') as ImageSourcePropType },
  { id: 'balon', name: 'Balon', source: require('../../../../../assets/pares/balon.webp') as ImageSourcePropType },
  { id: 'barco', name: 'Barco', source: require('../../../../../assets/pares/barco.webp') as ImageSourcePropType },
  { id: 'bombilla', name: 'Bombilla', source: require('../../../../../assets/pares/bombilla.webp') as ImageSourcePropType },
  { id: 'castillo', name: 'Castillo', source: require('../../../../../assets/pares/castillo.webp') as ImageSourcePropType },
  { id: 'coche', name: 'Coche', source: require('../../../../../assets/pares/coche.webp') as ImageSourcePropType },
  { id: 'cofre', name: 'Cofre', source: require('../../../../../assets/pares/cofre.webp') as ImageSourcePropType },
  { id: 'cohete', name: 'Cohete', source: require('../../../../../assets/pares/cohete.webp') as ImageSourcePropType },
  { id: 'conejo', name: 'Conejo', source: require('../../../../../assets/pares/conejo.webp') as ImageSourcePropType },
  { id: 'corona', name: 'Corona', source: require('../../../../../assets/pares/corona.webp') as ImageSourcePropType },
  { id: 'elefante', name: 'Elefante', source: require('../../../../../assets/pares/elefante.webp') as ImageSourcePropType },
  { id: 'estrella', name: 'Estrella', source: require('../../../../../assets/pares/estrella.webp') as ImageSourcePropType },
  { id: 'gato', name: 'Gato', source: require('../../../../../assets/pares/gato.webp') as ImageSourcePropType },
  { id: 'llave', name: 'Llave', source: require('../../../../../assets/pares/llave.webp') as ImageSourcePropType },
  { id: 'manzana', name: 'Manzana', source: require('../../../../../assets/pares/manzana.webp') as ImageSourcePropType },
  { id: 'perro', name: 'Perro', source: require('../../../../../assets/pares/perro.webp') as ImageSourcePropType },
  { id: 'regalo', name: 'Regalo', source: require('../../../../../assets/pares/regalo.webp') as ImageSourcePropType },
  { id: 'sol', name: 'Sol', source: require('../../../../../assets/pares/sol.webp') as ImageSourcePropType },
  { id: 'tierra', name: 'Tierra', source: require('../../../../../assets/pares/tierra.webp') as ImageSourcePropType },
];

// Precarga las imagenes de pares en cache
export function preloadPairCardAssets() {
  return Promise.all(
    PAIR_CARD_ASSETS.map(asset => {
      const resolved = Image.resolveAssetSource(asset.source);

      if (!resolved?.uri) {
        return Promise.resolve(false);
      }

      return Image.prefetch(resolved.uri);
    }),
  );
}
