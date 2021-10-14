import { ActionPanel, CopyToClipboardAction, List, OpenInBrowserAction, showToast, ToastStyle } from "@raycast/api";
import { useState, useEffect } from "react";
import fetch from "node-fetch";
import { getPreferenceValues } from "@raycast/api";

const useDebouncedEffect = (
  callback: () => any, delay = 250, dependencies?: any[],
) => useEffect(() => {
  const timer = setTimeout(callback, delay);

  return () => {
    clearTimeout(timer);
  };
}, dependencies);

export default function ArticleList() {
  const [searchText, setSearchText] = useState('');
  const [state, setState] = useState<{ articles: Article[] }>({ articles: [] });

  useDebouncedEffect(() => {
    async function fetch() {
      const articles = await fetchArticles(searchText);
      setState((oldState) => ({
        ...oldState,
        articles: articles,
      }));
    }
    fetch();
  }, 200, [searchText]);

  return (
    <List onSearchTextChange={setSearchText} isLoading={state.articles.length === 0} searchBarPlaceholder="Filter articles by name...">
      {state.articles.map((article) => (
        <ArticleListItem key={article._id} article={article} />
      ))}
    </List>
  );
}

function ArticleListItem(props: { article: Article }) {
  const article = props.article;

  return (
    <List.Item
      id={`${article._id}`}
      key={article._id}
      title={article.title}
      subtitle={article.tags.reduce((total, tag) => `#${tag}, ${total}`, '')}
      icon="list-icon.png"
      accessoryTitle={article.domain}
      actions={
        <ActionPanel>
          <OpenInBrowserAction url={article.link} />
          {article.tags.map((tag, id) => (
            <OpenInBrowserAction key={id} url={`https://app.raindrop.io/my/0/%23${tag}`} title={`Open #${tag} in raindrop`} />
          ))}
          <CopyToClipboardAction title="Copy URL" content={article.link} shortcut={{ key: 'c', modifiers: ['cmd', 'opt'] }} />
        </ActionPanel>
      }
    />
  );
}

interface Preferences {
  raindrop_token: string;
}

async function fetchArticles(search: string): Promise<Article[]> {
  const { raindrop_token }: Preferences = getPreferenceValues();

  try {
    const response = await fetch(
      `https://api.raindrop.io/rest/v1/raindrops/0?search=${encodeURIComponent(search)}`,
      { headers: { Authorization: `Bearer ${raindrop_token}` } }
    );
    const json = await response.json();
    return (json as Record<string, unknown>).items as Article[];
  } catch (error) {
    console.error(error);
    showToast(ToastStyle.Failure, "Could not load articles");
    return Promise.resolve([]);
  }
}

type Article = {
  _id: string;
  title: string;
  link: string;
  type: string;
  tags: string[];
  domain: string;
};
