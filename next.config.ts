import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
    turbopack: {
        resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.mjs', '.json', '.md'],
        rules: {
            "*.md": {
                loaders: ["raw-loader"],
                as: "*.js"
            }
        }
    },
    images: {
        remotePatterns: [new URL("https://bvxxbkafrjoboauypopg.supabase.co/**")],
    }
}

export default nextConfig