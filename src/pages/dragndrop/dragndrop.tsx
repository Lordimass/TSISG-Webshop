import { useEffect, useState } from "react";
import { getLoggedIn, getNoImageProds, getUser } from "../../assets/utils";
import "./dragndrop.css"
import { supabase } from "../home/home";
import { page_title } from "../../assets/consts";

type noImageProd = {
    sku: number,
    name: string
}

export default function DragNDrop() {
    const prods: noImageProd[] = getNoImageProds()

    return (<div>
        <p>{prods.length} Remaining on Last Reload</p>
        <ul>{prods.map((prod)=><NoImageProd prod={prod} key={prod.sku}/>)}</ul>

    </div>);
}

function NoImageProd({prod}: {prod:noImageProd}) {
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState('');

    async function handleDrop(e: React.DragEvent<HTMLDivElement>, sku: number) {
        e.preventDefault();
        const file = e.dataTransfer.files[0];

        // Get Access Token
        const {data: { session }, error: sessionError} = await supabase.auth.getSession();
            if (sessionError || !session?.access_token) {
            setMessage('You must be logged in to upload');
            return;
        }

        // Confirm its still valid
        {const {data: {user}, error: sessionError} = await supabase.auth.getUser()
        if (sessionError || !user) {
            setMessage("Invalid Session, Please re-authenticate")
            return
        }}
        
        if (!file) return; // If there was no file, skip


        const formData = new FormData();
        formData.append('file', file);
        formData.append("sku", sku as unknown as string)

        setUploading(true);
        setMessage("...");

        try {
            const res = await fetch('.netlify/functions/uploadProductImage', {
            method: 'POST',
            headers: {Authorization: `Bearer ${session.access_token}`},
            body: formData,
            });

            const data = await res.json();
            setMessage(data.message || 'Upload complete!');

            if (data.error) {
            setMessage(data.error)
            }
        } catch (err) {
            console.error(err);
            setMessage('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    return (<li className="noImProd">
        <title>{page_title} - Drag 'n' Drop</title>
        <meta name="robots" content="noindex"/>
        
        {JSON.stringify(prod)}
        <div 
            onDragOver={(e) => {e.preventDefault();}} 
            onDrop={(e)=>{handleDrop(e, prod.sku)}}

            className="dropbox"
        >
            {uploading ? 'Uploading...' : 'Drag and drop a file here'}
            {message && <p>{message}</p>}
        </div>
    </li>)
}