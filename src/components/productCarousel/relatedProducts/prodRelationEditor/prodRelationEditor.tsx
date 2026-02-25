import "./prodRelationEditor.css";
import { FormEvent, useContext, useEffect, useRef, useState } from "react";
import { callRPC } from "@shared/functions/supabaseRPC.ts";
import { supabase } from "../../../../lib/supabaseRPC.tsx";
import { AutocompleteInput } from "../../../autocompleteInput/autocompleteInput.tsx";
import { NotificationsContext } from "../../../notification/lib.tsx";

/**
 * Editor for product relations. Should only be accessible for those with `edit_products` permission, this is not
 * checked by this component
 */
export function ProductRelationEditor({
  sku,
  fetchRelations,
}: {
  /** The SKU of the product whose relations you want to edit */
  sku: number;
  /** Callback function to re-fetch the relations in the parent component */
  fetchRelations?: () => Promise<void>;
}) {
  // Return null if no permissions
  const { notify } = useContext(NotificationsContext);
  const [directRelations, setDirectRelations] = useState<
    { sku: number; name: string }[]
  >([]);
  const [productNames, setProductNames] = useState<
    { sku: number; name: string }[]
  >([]);
  useEffect(() => {
    async function fetch() {
      const skus = (await callRPC("get_product_relations", supabase, {
        sku: sku,
        depth: 1,
      })) as number[];
      const names = (await callRPC("get_product_names", supabase)) as {
        sku: number;
        name: string;
      }[];

      setDirectRelations(names.filter((name) => skus.includes(name.sku)));
      // Don't include self as valid relation, effectively disallowing reflexive relations
      setProductNames(names.filter((name) => name.sku !== sku));
    }
    fetch().then();
  }, [sku]);

  const textArea = useRef<HTMLTextAreaElement>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!textArea.current) return;
    const input = textArea.current.value;
    const nameObj = productNames.find((name) => name.name === input);
    // Disallow relations to invalid product names
    if (!nameObj) {
      input ? notify(`"${input}" is not a valid product name.`) : null;
      return;
    }
    // Disallow duplicates
    else if (directRelations.find((relation) => relation.name === input)) {
      notify(`Relation with "${input}" already exists.`);
      return;
    }

    setDirectRelations([...directRelations, nameObj]);
    await callRPC("add_product_relation", supabase, {
      sku1: sku,
      sku2: nameObj.sku,
    });
    if (fetchRelations) await fetchRelations();
    console.log("Adding new relation:", nameObj.name);
  }

  async function handleRemove(relToRemove: { sku: number; name: string }) {
    setDirectRelations(
      directRelations.filter((relation) => relation.sku !== relToRemove.sku),
    );
    await callRPC("remove_product_relation", supabase, {
      p_sku1: sku,
      p_sku2: relToRemove.sku,
    });
    if (fetchRelations) await fetchRelations();
    console.log("Removing relation:", relToRemove.name);
  }

  return (
    <div className={"product-relation-editor"}>
      <h2>Relationship Editor</h2>
      <ul className="list-group">
        <li className="list-group-item">
          <form onSubmit={handleSubmit}>
            <AutocompleteInput
              values={productNames.map((pn) => pn.name)}
              ref={textArea}
            />
            <input type="submit" value={"Submit"} />
          </form>
          <button className="refresh-carousel-button" onClick={fetchRelations}>
            Refresh Carousel
          </button>
        </li>
        {directRelations.map((relation, i) => (
          <li className="list-group-item" key={i}>
            {relation.name}
            <div className="spacer" />
            <button
              className="remove-button"
              onClick={() => handleRemove(relation)}
            >
              X
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
