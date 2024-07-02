import random
import numpy as np
import matplotlib.pyplot as plt

def calculate_crash_point():
    r = random.random()
    if r < 1/33:  # 3.03% chance of instant crash
        return 1.00
    return max(1.00, 0.99 / (1 - r))

def player_cashout_strategy():
    strategy = random.random()
    if strategy < 0.7:  # 70% of players cash out between 1.1x and 2x
        return random.uniform(1.1, 2.0)
    elif strategy < 0.95:  # 25% of players cash out between 2x and 5x
        return random.uniform(2.0, 5.0)
    else:  # 5% of players aim for high multipliers
        return random.uniform(5.0, 20.0)

def simulate_game(players):
    crash_point = calculate_crash_point()
    bets = []
    cashouts = []
    for player in players:
        if player['balance'] > 0:
            bet = random.randint(1, min(int(player['balance']), 100))
            cashout = min(player_cashout_strategy(), crash_point)
        else:
            bet = 0
            cashout = 1.00
        bets.append(bet)
        cashouts.append(cashout)
    
    house_profit = sum(bets)
    for i, (bet, cashout) in enumerate(zip(bets, cashouts)):
        if bet > 0:
            if cashout < crash_point:
                winnings = int(bet * cashout)
                players[i]['balance'] += winnings - bet
                house_profit -= winnings
            else:
                players[i]['balance'] -= bet
    
    return crash_point, bets, cashouts, house_profit

def calculate_apy(initial_balance, final_balance, time_elapsed_days):
    if time_elapsed_days == 0 or initial_balance >= final_balance:
        return 0
    return (((final_balance / initial_balance) ** (365 / time_elapsed_days)) - 1) * 100

def run_simulation(num_games, num_players, initial_balance, house_balance, games_per_day):
    players = [{'balance': initial_balance} for _ in range(num_players)]
    initial_house_balance = house_balance
    results = []
    apys = []
    cumulative_profits = [0]
    
    for game_number in range(num_games):
        crash_point, bets, cashouts, house_profit = simulate_game(players)
        house_balance += house_profit
        results.append((crash_point, bets, cashouts, house_profit))
        cumulative_profits.append(house_balance - initial_house_balance)
        
        if (game_number + 1) % games_per_day == 0:
            days_elapsed = (game_number + 1) / games_per_day
            current_apy = calculate_apy(initial_house_balance, house_balance, days_elapsed)
            apys.append((days_elapsed, current_apy))
    
    return results, players, house_balance, apys, cumulative_profits

def show_plot(fig):
    plt.show(block=False)
    input("Press Enter to continue to the next plot...")
    plt.close(fig)

# Run simulation
num_games = 1000
num_players = 100
initial_balance = 1000
house_balance = 1000000
games_per_day = 20  # Assuming 1000 games are played per day
simulation_results, final_players, final_house_balance, apys, cumulative_profits = run_simulation(num_games, num_players, initial_balance, house_balance, games_per_day)

# Analyze results
crash_points = [result[0] for result in simulation_results]
total_bets = sum(sum(result[1]) for result in simulation_results)
total_house_profit = sum(result[3] for result in simulation_results)
house_profit_percentage = (total_house_profit / total_bets) * 100

# Calculate RTP
total_wagered = sum(sum(result[1]) for result in simulation_results)
total_won = sum(sum(bet * cashout for bet, cashout in zip(result[1], result[2]) if cashout < result[0]) for result in simulation_results)
rtp = (total_won / total_wagered) * 100
house_edge = 100 - rtp

all_cashouts = [cashout for result in simulation_results for cashout in result[2] if cashout > 1.00]
avg_cashout = np.mean(all_cashouts)

# Calculate theoretical house edge and RTP
theoretical_house_edge = (1/33) * avg_cashout * 100
theoretical_rtp = 100 - theoretical_house_edge

# Calculate average and median profit per game
profits_per_game = [result[3] for result in simulation_results]
avg_profit_per_game = np.mean(profits_per_game)
median_profit_per_game = np.median(profits_per_game)

# Print summary statistics
print(f"Total games: {num_games}")
print(f"Total bets: ${total_bets:,.2f}")
print(f"House profit: ${total_house_profit:,.2f}")
print(f"House profit percentage: {house_profit_percentage:.2f}%")
print(f"Average profit per game: ${avg_profit_per_game:.2f}")
print(f"Median profit per game: ${median_profit_per_game:.2f}")
print(f"Final house balance: {final_house_balance:,.2f}")
print(f"House balance increase: {(final_house_balance - house_balance):,.2f}")
print(f"Average crash point: {np.mean(crash_points):.2f}")
print(f"Median crash point: {np.median(crash_points):.2f}")
print(f"Average cash-out multiplier: {avg_cashout:.2f}")
print(f"Theoretical house edge: {theoretical_house_edge:.2f}%")
print(f"Theoretical RTP: {theoretical_rtp:.2f}%")
print(f"Simulated RTP: {rtp:.2f}%")
print(f"Simulated house edge: {house_edge:.2f}%")

# Top 10 players
top_players = sorted(final_players, key=lambda x: x['balance'], reverse=True)[:10]
print("\nTop 10 Player Balances:")
for i, player in enumerate(top_players, 1):
    print(f"Player {i}: ${player['balance']:,.2f}")

# Set the style for all plots
plt.style.use('dark_background')

# Neon green color
neon_green = '#39FF14'

# 1. Crash point distribution
fig, ax = plt.subplots(figsize=(12, 8))
fig.patch.set_facecolor('black')
ax.hist(crash_points, bins=100, range=(1, 10), edgecolor='black', color=neon_green)
ax.set_title('Crash Point Distribution', color=neon_green, fontweight='bold')
ax.set_xlabel('Crash Point', color=neon_green)
ax.set_ylabel('Frequency', color=neon_green)
ax.tick_params(colors=neon_green)
show_plot(fig)

# 2. House profit per game
fig, ax = plt.subplots(figsize=(12, 8))
fig.patch.set_facecolor('black')
ax.hist(profits_per_game, bins=50, edgecolor='black', color=neon_green)
ax.axvline(avg_profit_per_game, color='red', linestyle='dashed', linewidth=2)
ax.set_title('House Profit per Game', color=neon_green, fontweight='bold')
ax.set_xlabel('Profit ($)', color=neon_green)
ax.set_ylabel('Frequency', color=neon_green)
ax.tick_params(colors=neon_green)
ax.text(avg_profit_per_game, ax.get_ylim()[1], f'Avg: ${avg_profit_per_game:.2f}', 
        color='red', ha='center', va='bottom')
show_plot(fig)

# 3. Improved RTP visualization
fig, ax = plt.subplots(figsize=(12, 8))
fig.patch.set_facecolor('black')

# Create bar chart
categories = ['Theoretical RTP', 'Theoretical House Edge']
values = [theoretical_rtp, theoretical_house_edge]
x_pos = np.arange(len(categories))

bars = ax.bar(x_pos, values, align='center', alpha=0.8, color=[neon_green, 'red'])

# Customize the chart
ax.set_ylabel('Percentage (%)', color=neon_green)
ax.set_title('Theoretical Return to Player (RTP) and House Edge', color=neon_green, fontweight='bold')
ax.set_xticks(x_pos)
ax.set_xticklabels(categories, color=neon_green)
ax.tick_params(axis='y', colors=neon_green)

# Add value labels on the bars
def autolabel(rects):
    for rect in rects:
        height = rect.get_height()
        ax.annotate(f'{height:.2f}%',
                    xy=(rect.get_x() + rect.get_width() / 2, height),
                    xytext=(0, 3),  # 3 points vertical offset
                    textcoords="offset points",
                    ha='center', va='bottom', color='white')

autolabel(bars)

# Add a line at 100% for reference
ax.axhline(y=100, color='white', linestyle='--', alpha=0.5)

# Add text explanation
explanation = (
    "Theoretical RTP = 100% - Theoretical House Edge\n"
    f"Theoretical House Edge = (1/33) * {avg_cashout:.2f} (avg cashout) * 100\n"
    "RTP (Return to Player) is the percentage of wagers\n"
    "that is expected to be paid back to players over time.\n"
    "House Edge is the casino's statistical advantage."
)
ax.text(0.5, -0.2, explanation, transform=ax.transAxes, ha='center', va='center', color='white', alpha=0.7)

# Set y-axis limit to slightly above 100%
ax.set_ylim(0, 105)

show_plot(fig)

# 4. Cumulative house profit
fig, ax = plt.subplots(figsize=(12, 8))
fig.patch.set_facecolor('black')
cumulative_profit = np.cumsum(profits_per_game)
ax.plot(cumulative_profit, color=neon_green)
ax.set_title('Cumulative House Profit', color=neon_green, fontweight='bold')
ax.set_xlabel('Game Number', color=neon_green)
ax.set_ylabel('Cumulative Profit ($)', color=neon_green)
ax.tick_params(colors=neon_green)
show_plot(fig)

# Add a new plot for APY over time
fig, ax1 = plt.subplots(figsize=(12, 8))
fig.patch.set_facecolor('black')

# Plot APY
days, apy_values = zip(*apys)
ax1.plot(days, apy_values, color=neon_green, label='APY')
ax1.set_xlabel('Days', color=neon_green)
ax1.set_ylabel('APY (%)', color=neon_green)
ax1.tick_params(axis='y', labelcolor=neon_green)
ax1.set_ylim(bottom=0)  # Set lower limit to 0%, no upper limit

# Plot cumulative profit on secondary y-axis
ax2 = ax1.twinx()
cumulative_profit_days = [i / games_per_day for i in range(len(cumulative_profits))]
ax2.plot(cumulative_profit_days, cumulative_profits, color='red', alpha=0.5, label='Cumulative Profit')
ax2.set_ylabel('Cumulative Profit ($)', color='red')
ax2.tick_params(axis='y', labelcolor='red')

# Combine legends
lines1, labels1 = ax1.get_legend_handles_labels()
lines2, labels2 = ax2.get_legend_handles_labels()
ax1.legend(lines1 + lines2, labels1 + labels2, loc='upper left')

ax1.set_title('APY and Cumulative Profit Over Time', color=neon_green, fontweight='bold')
ax1.grid(True, color='gray', linestyle='--', alpha=0.3)

# Add final APY annotation
final_apy = apy_values[-1]
annotation_text = f'Final APY: {final_apy:.2f}%'
if final_apy > 1000:
    annotation_text += f'\n({final_apy:.2e}%)'  # Scientific notation for very large values
ax1.annotate(annotation_text, 
             xy=(days[-1], final_apy), 
             xytext=(0.7, 0.95), 
             textcoords='axes fraction',
             color='white', 
             fontweight='bold',
             arrowprops=dict(facecolor='white', shrink=0.05))

# Add explanation
explanation = (
    "APY shows the annualized return on investment for the house.\n"
    "It considers the growth of the house balance over time.\n"
    "Cumulative Profit shows the total profit accumulated.\n"
    "APY can exceed 100% in high-volatility scenarios."
)
plt.text(0.5, -0.15, explanation, transform=ax1.transAxes, ha='center', va='center', color='white', alpha=0.7)

show_plot(fig)

# Print final APY
print(f"\nFinal APY after {num_games} games: {final_apy:.2f}%")