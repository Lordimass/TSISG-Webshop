import { JSX } from "react"
import Markdown from "react-markdown"
import { octokit, GITHUB_OWNER, GITHUB_REPO } from "../../consts"

export type ListCommitsResponse = Awaited<ReturnType<typeof octokit.rest.repos.listCommits>>
export type Commit = ListCommitsResponse["data"][number]

export async function getAllGithubCommits(since:string, until:string) {
    const branches = (await octokit.rest.repos.listBranches({
        owner: GITHUB_OWNER, repo: GITHUB_REPO
    })).data
    let commits: Commit[] = []
    for (let i=0; i<branches.length; i++) {
        const b = branches[i]
        const resp = await octokit.rest.repos.listCommits({
            owner: GITHUB_OWNER, repo: GITHUB_REPO, since, until, per_page: 100, sha: b.name
        })
        // Filter out commits that are already on other branches
        commits.push(...resp.data.filter(c=>!commits.map(c=>c.sha).includes(c.sha)))
    }
    return commits.sort((a,b) => 
        Date.parse(b.commit.author?.date ?? "0") -
        Date.parse(a.commit.author?.date ?? "0")
    )
}

export function getCommitMessage(c: Commit): JSX.Element {
    const desc = c.commit.message.split("\n").slice(2).join("\n\n");
    const linkedDesc = desc.replace(/#(\d+)/g, (_, issueNumber) => 
        `[#${issueNumber}](https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/issues/${issueNumber})`
    )
    return <Markdown>
        {linkedDesc}
    </Markdown>
}