// Tests unitaires pour les fonctions utilitaires du gestionnaire de favoris

// Simuler la fonction formatUrl du script principal
function formatUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
    }
    return url;
}

// Regex utilisée dans le script principal
const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/\S*)?$/;

describe('formatUrl', () => {
    test('ajoute https:// si manquant', () => {
        expect(formatUrl('exemple.com')).toBe('https://exemple.com');
        expect(formatUrl('www.site.org')).toBe('https://www.site.org');
    });
    test('ne modifie pas une URL déjà complète', () => {
        expect(formatUrl('http://exemple.com')).toBe('http://exemple.com');
        expect(formatUrl('https://exemple.com')).toBe('https://exemple.com');
    });
});

describe('urlPattern', () => {
    test('valide les bonnes URLs', () => {
        expect(urlPattern.test('https://exemple.com')).toBe(true);
        expect(urlPattern.test('http://site.org/page')).toBe(true);
        expect(urlPattern.test('www.site.org')).toBe(true);
        expect(urlPattern.test('exemple.com')).toBe(true);
    });
    test('rejette les mauvaises URLs', () => {
        expect(urlPattern.test('notaurl')).toBe(false);
        expect(urlPattern.test('http:/bad.com')).toBe(false);
        expect(urlPattern.test('')).toBe(false);
    });
});