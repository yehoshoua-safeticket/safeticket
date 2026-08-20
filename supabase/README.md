# Base de données

Les fichiers SQL suivent désormais la convention de la CLI Supabase. Jusqu'ici ils
vivaient à plat dans ce dossier, sans ordre ni trace de ce qui avait été appliqué —
la seule façon de savoir dans quel état était une base était de la regarder.

## Organisation

| Chemin | Rôle |
|---|---|
| `migrations/` | Changements de schéma, ordonnés. **Ne jamais modifier un fichier déjà appliqué** — en ajouter un nouveau. |
| `scripts/` | Opérations manuelles ponctuelles (bootstrap, nettoyage). Pas des migrations, jamais rejouées automatiquement. |
| `seed.sql` | Données d'exemple pour une base de développement. |
| `config.toml` | Config CLI. |

Les migrations sont nommées `<horodatage>_<nom>.sql`. L'horodatage vient de la date
du commit qui a introduit le fichier, ce qui préserve l'ordre historique réel
d'application.

## Appliquer les migrations

```bash
# une seule fois, pour relier le dépôt au projet distant
supabase link --project-ref hcxdooiirngjodlckjsv

supabase db push          # applique ce qui manque
supabase migration list   # montre local vs distant
```

## ⚠️ Première adoption : marquer l'existant comme appliqué

La base de production a **déjà** reçu toutes ces migrations, à la main via l'éditeur
SQL. Elle n'a simplement aucune trace de ce fait. Un `supabase db push` direct
tenterait donc de tout rejouer.

La plupart des fichiers sont idempotents (`IF NOT EXISTS` / `IF EXISTS`) et
survivraient, mais ce n'est pas une garantie sur laquelle s'appuyer. Avant le
premier `db push`, déclarer chaque migration comme déjà appliquée :

```bash
for v in 20260624114340 20260624114341 20260624114342 20260624114343 \
         20260626134811 20260721184547 20260803143005 20260803143006 \
         20260803150707 20260804125341 20260806133718; do
  supabase migration repair --status applied "$v"
done

supabase migration list   # vérifier que tout est aligné avant de continuer
```

À faire **une seule fois**, sur la base de production. Une base neuve, elle, prend
`supabase db push` directement.

## Ajouter une migration

```bash
supabase migration new nom_du_changement
```

Écrire le SQL dans le fichier créé, puis `supabase db push`. Garder les migrations
idempotentes quand c'est possible : c'est ce qui rend une réapplication accidentelle
inoffensive.
