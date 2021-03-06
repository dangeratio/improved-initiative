module ImprovedInitiative {
    export class SpellLibrary {
        Spells = ko.observableArray<SpellListing>([]);
        SpellsByNameRegex = ko.computed(() => {
            const allSpellNames = this.Spells().map(s => s.Name());
            if (allSpellNames.length === 0) {
                return new RegExp('a^');
            }
            return new RegExp(`\\b(${allSpellNames.join("|")})\\b`, "gim");
        });

        constructor() {
            $.ajax("../spells/").done(this.addSpellListings);

            const customSpells = Store.List(Store.Spells);
            customSpells.forEach(id => {
                var spell = { ...Spell.Default(), ...Store.Load<Spell>(Store.Spells, id) };
                this.Spells.push(new SpellListing(id, spell.Name, Spell.GetKeywords(spell), null, "localStorage", spell));
            });

            const appInsights: Client = window["appInsights"];
            appInsights.trackEvent("CustomSpells", { Count: customSpells.length.toString() });
        }

        private addSpellListings = (listings: { Id: string, Name: string, Keywords: string, Link: string }[]) => {
            listings.sort((c1, c2) => {
                return c1.Name.toLocaleLowerCase() > c2.Name.toLocaleLowerCase() ? 1 : -1;
            });
            ko.utils.arrayPushAll<SpellListing>(this.Spells, listings.map(c => {
                return new SpellListing(c.Id, c.Name, c.Keywords, c.Link, "server");
            }));
        }

        public AddOrUpdateSpell = (spell: Spell) => {
            this.Spells.remove(listing => listing.Source === "localStorage" && listing.Id === spell.Id);
            const listing = new SpellListing(spell.Id, spell.Name, Spell.GetKeywords(spell), null, "localStorage", spell);
            this.Spells.unshift(listing);
            Store.Save(Store.Spells, spell.Id, spell);
        }

        public DeleteSpellById = (id: string) => {
            this.Spells.remove(listing => listing.Id === id);
            Store.Delete(Store.Spells, id);
        }
    }
}