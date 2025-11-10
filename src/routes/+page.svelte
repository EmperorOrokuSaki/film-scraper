<script lang="ts">
	import type { FilmScreening, DayGroup } from '$lib/types';
	import type { PageData } from './$types';

	export let data: PageData;

	let searchQuery = '';
	let selectedSource: 'all' | 'babylon' | 'yorck' = 'all';

	$: screenings = data.screenings as FilmScreening[];

	function groupByDay(screenings: FilmScreening[]): DayGroup[] {
		const groups: Record<string, FilmScreening[]> = {};

		for (const screening of screenings) {
			if (!screening.day) continue;
			if (!groups[screening.day]) {
				groups[screening.day] = [];
			}
			groups[screening.day].push(screening);
		}

		return Object.entries(groups)
			.map(([date, screenings]) => ({ date, screenings }))
			.sort((a, b) => a.date.localeCompare(b.date));
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	$: filteredScreenings = screenings.filter((s) => {
		const matchesSearch =
			searchQuery === '' ||
			s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			s.description?.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesSource = selectedSource === 'all' || s.source === selectedSource;
		return matchesSearch && matchesSource;
	});

	$: dayGroups = groupByDay(filteredScreenings);
</script>

<svelte:head>
	<title>Film Screenings - Berlin</title>
</svelte:head>

<main>
	<header>
		<h1>🎬 Film Screenings in Berlin</h1>
		<p>Original language films (OmU, OmeU, OV) from Babylon Berlin & Yorck Kinos</p>
		<p class="build-info">Data updated at build time • Deployed on GitHub Pages</p>
	</header>

	<div class="controls">
		<input
			type="text"
			placeholder="Search films..."
			bind:value={searchQuery}
			class="search"
		/>

		<div class="filters">
			<button
				class:active={selectedSource === 'all'}
				on:click={() => (selectedSource = 'all')}
			>
				All
			</button>
			<button
				class:active={selectedSource === 'babylon'}
				on:click={() => (selectedSource = 'babylon')}
			>
				Babylon
			</button>
			<button
				class:active={selectedSource === 'yorck'}
				on:click={() => (selectedSource = 'yorck')}
			>
				Yorck
			</button>
		</div>

	</div>

	{#if dayGroups.length === 0}
		<div class="empty">No films found. Data will be updated on next deployment.</div>
	{:else}
		{#each dayGroups as { date, screenings }}
			<section class="day-section">
				<h2>{formatDate(date)}</h2>
				<div class="films-grid">
					{#each screenings as film}
						<article class="film-card">
							{#if film.imageUrl}
								<img src={film.imageUrl} alt={film.title} />
							{/if}
							<div class="film-info">
								<h3>
									{#if film.url}
										<a href={film.url} target="_blank" rel="noopener noreferrer">{film.title}</a>
									{:else}
										{film.title}
									{/if}
								</h3>

								<div class="meta">
									{#if film.year}
										<span>{film.year}</span>
									{/if}
									{#if film.runtime}
										<span>{film.runtime}</span>
									{/if}
									{#if film.genre || film.category}
										<span>{film.genre || film.category}</span>
									{/if}
								</div>

								{#if film.director}
									<p class="director">Dir: {film.director}</p>
								{/if}

								{#if film.description}
									<p class="description">{film.description}</p>
								{/if}

								{#if film.tags && film.tags.length > 0}
									<div class="tags">
										{#each film.tags as tag}
											<span class="tag">{tag}</span>
										{/each}
									</div>
								{/if}

								{#if film.showtimes && film.showtimes.length > 0}
									<div class="showtimes">
										{#each film.showtimes as showtime}
											<div class="showtime">
												<span class="time">{showtime.time}</span>
												{#if showtime.cinema}
													<span class="cinema">{showtime.cinema}</span>
												{/if}
												{#if showtime.format}
													<span class="format">{showtime.format}</span>
												{/if}
												{#if showtime.url}
													<a href={showtime.url} target="_blank" rel="noopener noreferrer">
														Book
													</a>
												{/if}
											</div>
										{/each}
									</div>
								{/if}
							</div>
						</article>
					{/each}
				</div>
			</section>
		{/each}
	{/if}
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
			sans-serif;
		background: #f5f5f5;
		color: #333;
	}

	main {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1rem;
	}

	header {
		text-align: center;
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 2.5rem;
		margin: 0 0 0.5rem 0;
		color: #222;
	}

	header p {
		color: #666;
		font-size: 1.1rem;
	}

	.build-info {
		color: #999;
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}

	.controls {
		display: flex;
		gap: 1rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
		align-items: center;
	}

	.search {
		flex: 1;
		min-width: 200px;
		padding: 0.75rem 1rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 1rem;
	}

	.search:focus {
		outline: none;
		border-color: #4a90e2;
	}

	.filters {
		display: flex;
		gap: 0.5rem;
	}

	button {
		padding: 0.75rem 1.5rem;
		border: 2px solid #ddd;
		background: white;
		border-radius: 8px;
		cursor: pointer;
		font-size: 1rem;
		transition: all 0.2s;
	}

	button:hover {
		border-color: #4a90e2;
		background: #f0f7ff;
	}

	button.active {
		border-color: #4a90e2;
		background: #4a90e2;
		color: white;
	}

	button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.empty {
		text-align: center;
		padding: 3rem;
		font-size: 1.2rem;
		color: #666;
	}

	.day-section {
		margin-bottom: 3rem;
	}

	.day-section h2 {
		font-size: 1.75rem;
		margin: 0 0 1rem 0;
		color: #222;
		border-bottom: 2px solid #4a90e2;
		padding-bottom: 0.5rem;
	}

	.films-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1.5rem;
	}

	.film-card {
		background: white;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		transition: transform 0.2s, box-shadow 0.2s;
	}

	.film-card:hover {
		transform: translateY(-4px);
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
	}

	.film-card img {
		width: 100%;
		height: 200px;
		object-fit: cover;
	}

	.film-info {
		padding: 1.25rem;
	}

	.film-info h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.25rem;
	}

	.film-info h3 a {
		color: #222;
		text-decoration: none;
	}

	.film-info h3 a:hover {
		color: #4a90e2;
	}

	.meta {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
		font-size: 0.9rem;
		color: #666;
	}

	.director {
		font-style: italic;
		color: #555;
		margin: 0 0 0.5rem 0;
		font-size: 0.95rem;
	}

	.description {
		color: #555;
		line-height: 1.5;
		margin: 0 0 0.75rem 0;
		font-size: 0.95rem;
	}

	.tags {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
	}

	.tag {
		background: #e3f2fd;
		color: #1976d2;
		padding: 0.25rem 0.75rem;
		border-radius: 12px;
		font-size: 0.85rem;
	}

	.showtimes {
		border-top: 1px solid #eee;
		padding-top: 0.75rem;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.showtime {
		display: flex;
		gap: 0.75rem;
		align-items: center;
		flex-wrap: wrap;
		font-size: 0.9rem;
	}

	.time {
		font-weight: bold;
		color: #4a90e2;
	}

	.cinema {
		color: #666;
	}

	.format {
		background: #fff3e0;
		color: #f57c00;
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
		font-size: 0.85rem;
	}

	.showtime a {
		color: #4a90e2;
		text-decoration: none;
		font-size: 0.85rem;
	}

	.showtime a:hover {
		text-decoration: underline;
	}
</style>
