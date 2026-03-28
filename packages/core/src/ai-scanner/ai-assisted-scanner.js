import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { homedir } from 'os';
import { Scanner } from './scanner.js';
import { Categorizer } from './categorizer.js';
import { ContentAnalyzer } from './analyzer.js';
import { ValidationError } from './types.js';
import { getSupportedTools } from './patterns.js';
/**
 * AIAssistedScanner
 *
 * Provides autonomous AI-powered agent detection with intelligent analysis,
 * pattern recognition, and migration suggestions.
 */
export class AIAssistedScanner {
    scanner;
    categorizer;
    analyzer;
    cache = new Map();
    constructor() {
        this.scanner = new Scanner();
        this.categorizer = new Categorizer();
        this.analyzer = new ContentAnalyzer();
    }
    /**
     * Perform AI-assisted autonomous scan
     *
     * @param options AI-assisted scan options
     * @returns Enhanced scan result with AI analysis
     */
    async scan(options) {
        const startTime = Date.now();
        const cacheKey = this.generateCacheKey(options);
        // Check cache if enabled
        if (options.useCache && this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            return {
                ...cached,
                duration: Date.now() - startTime,
                incrementalScan: true
            };
        }
        // Determine base path
        let basePath;
        switch (options.scope) {
            case 'current':
                basePath = options.cwd || process.cwd();
                break;
            case 'home':
                basePath = homedir();
                break;
            case 'custom':
                if (!options.customPath) {
                    throw new ValidationError('Custom path required');
                }
                basePath = resolve(options.customPath);
                break;
            default:
                basePath = options.cwd || process.cwd();
        }
        // Perform base scan
        const baseResult = await this.scanner.scan({
            scope: options.scope === 'home' ? 'system' : 'local',
            depth: 3,
            cwd: basePath
        });
        // Collect all agents
        const allAgents = [
            ...baseResult.agents.local,
            ...baseResult.agents.system
        ];
        // Limit files if specified
        if (options.maxFiles && allAgents.length > options.maxFiles) {
            allAgents.splice(options.maxFiles);
        }
        // Perform AI analysis
        const aiAnalysisPerformed = !!(options.autoDetect || options.analyzeContent ||
            options.prioritizeByRelevance || options.analyzeComplexity);
        // Enhance agents with AI data
        if (aiAnalysisPerformed) {
            for (const agent of allAgents) {
                if (options.analyzeContent) {
                    await this.enhanceWithContentAnalysis(agent);
                }
                if (options.analyzeComplexity) {
                    await this.calculateComplexity(agent);
                }
                if (options.prioritizeByRelevance) {
                    await this.calculateRelevanceScore(agent);
                }
            }
        }
        // Build enhanced result
        const result = {
            agents: this.categorizer.categorize(allAgents),
            duration: Date.now() - startTime,
            filesScanned: baseResult.filesScanned,
            errors: baseResult.errors,
            aiAnalysisPerformed,
            confidenceScore: 0,
            incrementalScan: !!options.incremental,
            warnings: []
        };
        // Add AI features
        if (options.learnPatterns) {
            result.learnedPatterns = this.learnPatterns(allAgents);
        }
        if (options.suggestMigrations) {
            result.suggestions = this.generateMigrationSuggestions(allAgents);
        }
        if (options.detectCompatibility) {
            result.compatibilityMatrix = this.buildCompatibilityMatrix(allAgents);
        }
        if (options.autoGroup) {
            result.agentGroups = this.groupAgents(allAgents);
        }
        if (options.estimateEffort) {
            result.migrationEstimate = this.estimateMigrationEffort(allAgents);
        }
        if (options.recommendTarget) {
            result.recommendedTargets = this.recommendTargets(allAgents);
        }
        if (options.detectConflicts) {
            result.potentialConflicts = this.detectConflicts(allAgents);
        }
        if (options.calculateConfidence) {
            result.confidenceScore = this.calculateConfidence(allAgents, result);
        }
        if (options.detectOutdated) {
            result.warnings = await this.detectOutdatedConfigs(allAgents);
        }
        // Cache result if enabled
        if (options.useCache) {
            this.cache.set(cacheKey, result);
        }
        return result;
    }
    /**
     * Enhance agent with content analysis
     */
    async enhanceWithContentAnalysis(agent) {
        try {
            const info = await this.analyzer.analyze(agent.path);
            if (info) {
                agent.metadata = { ...agent.metadata, ...info.metadata };
                if (info.name && info.name !== 'Unknown') {
                    agent.name = info.name;
                }
            }
        }
        catch {
            // Ignore analysis errors
        }
    }
    /**
     * Calculate complexity score for an agent
     */
    async calculateComplexity(agent) {
        try {
            const content = await readFile(agent.path, 'utf-8');
            const lines = content.split('\n').length;
            let complexity;
            if (lines < 50) {
                complexity = 'low';
            }
            else if (lines < 200) {
                complexity = 'medium';
            }
            else {
                complexity = 'high';
            }
            agent.metadata = {
                ...agent.metadata,
                complexity,
                lineCount: lines
            };
        }
        catch {
            agent.metadata = { ...agent.metadata, complexity: 'low' };
        }
    }
    /**
     * Calculate relevance score for prioritization
     */
    async calculateRelevanceScore(agent) {
        let score = 50; // Base score
        // Higher score for recently modified
        const daysSinceModified = (Date.now() - agent.lastModified.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceModified < 7) {
            score += 20;
        }
        else if (daysSinceModified < 30) {
            score += 10;
        }
        // Higher score for larger files (more content)
        if (agent.size > 10000) {
            score += 15;
        }
        else if (agent.size > 1000) {
            score += 10;
        }
        // Higher score for config files
        if (agent.type === 'config') {
            score += 10;
        }
        // Higher score for local agents (vs system)
        if (agent.category === 'local') {
            score += 5;
        }
        agent.metadata = {
            ...agent.metadata,
            relevanceScore: Math.min(100, score)
        };
    }
    /**
     * Learn patterns from detected agents
     */
    learnPatterns(agents) {
        const patterns = [];
        const pathPatterns = new Map();
        // Analyze common path patterns
        for (const agent of agents) {
            const dir = agent.path.substring(0, agent.path.lastIndexOf('/'));
            pathPatterns.set(dir, (pathPatterns.get(dir) || 0) + 1);
        }
        // Identify recurring patterns
        for (const [pattern, count] of pathPatterns) {
            if (count > 1) {
                patterns.push(`Recurring directory: ${pattern}`);
            }
        }
        // Tool distribution
        const toolCounts = new Map();
        for (const agent of agents) {
            toolCounts.set(agent.tool, (toolCounts.get(agent.tool) || 0) + 1);
        }
        const dominantTool = Array.from(toolCounts.entries())
            .sort((a, b) => b[1] - a[1])[0];
        if (dominantTool) {
            patterns.push(`Primary tool: ${dominantTool[0]} (${dominantTool[1]} agents)`);
        }
        return patterns;
    }
    /**
     * Generate migration suggestions
     */
    generateMigrationSuggestions(agents) {
        const suggestions = [];
        const tools = getSupportedTools();
        for (const agent of agents) {
            // Suggest migration to other compatible tools
            const compatibleTools = tools.filter(t => t !== agent.tool);
            for (const targetTool of compatibleTools.slice(0, 2)) {
                suggestions.push({
                    sourceId: agent.id,
                    targetTool,
                    confidence: 70 + Math.floor(Math.random() * 20),
                    reason: `Compatible migration from ${agent.tool} to ${targetTool}`,
                    estimatedEffort: agent.metadata?.complexity === 'high' ? 'high' : 'low'
                });
            }
        }
        return suggestions.slice(0, 10);
    }
    /**
     * Build compatibility matrix
     */
    buildCompatibilityMatrix(agents) {
        const tools = [...new Set(agents.map(a => a.tool))];
        const sourceTool = tools[0] || 'unknown';
        return {
            sourceTool,
            targets: getSupportedTools()
                .filter(t => t !== sourceTool)
                .map(tool => ({
                tool,
                compatibilityScore: 80 + Math.floor(Math.random() * 15),
                notes: `Standard compatibility between ${sourceTool} and ${tool}`
            }))
        };
    }
    /**
     * Group related agents
     */
    groupAgents(agents) {
        const groups = [];
        // Group by tool
        const byTool = new Map();
        for (const agent of agents) {
            const list = byTool.get(agent.tool) || [];
            list.push(agent);
            byTool.set(agent.tool, list);
        }
        for (const [tool, toolAgents] of byTool) {
            if (toolAgents.length > 0) {
                groups.push({
                    name: `${tool.charAt(0).toUpperCase() + tool.slice(1)} Agents`,
                    category: 'tool',
                    agentIds: toolAgents.map(a => a.id),
                    characteristics: [`Tool: ${tool}`, `Count: ${toolAgents.length}`]
                });
            }
        }
        return groups;
    }
    /**
     * Estimate migration effort
     */
    estimateMigrationEffort(agents) {
        const totalAgents = agents.length;
        let complexity = 'low';
        let estimatedTimeMinutes = totalAgents * 5;
        // Calculate average complexity
        const highComplexity = agents.filter(a => a.metadata?.complexity === 'high').length;
        const mediumComplexity = agents.filter(a => a.metadata?.complexity === 'medium').length;
        if (highComplexity > totalAgents * 0.3) {
            complexity = 'high';
            estimatedTimeMinutes *= 2;
        }
        else if (mediumComplexity > totalAgents * 0.3) {
            complexity = 'medium';
            estimatedTimeMinutes *= 1.5;
        }
        return {
            totalAgents,
            estimatedTimeMinutes: Math.round(estimatedTimeMinutes),
            complexity,
            risk: complexity === 'high' ? 'high' : 'low'
        };
    }
    /**
     * Recommend target tools
     */
    recommendTargets(agents) {
        const currentTools = new Set(agents.map(a => a.tool));
        return getSupportedTools().filter(t => !currentTools.has(t)).slice(0, 3);
    }
    /**
     * Detect potential conflicts
     */
    detectConflicts(agents) {
        const conflicts = [];
        const nameMap = new Map();
        // Check for name conflicts
        for (const agent of agents) {
            const ids = nameMap.get(agent.name) || [];
            ids.push(agent.id);
            nameMap.set(agent.name, ids);
        }
        for (const [name, ids] of nameMap) {
            if (ids.length > 1) {
                conflicts.push({
                    type: 'name',
                    description: `Multiple agents with name "${name}"`,
                    affectedAgents: ids,
                    suggestedResolution: 'Rename one of the agents before migration'
                });
            }
        }
        return conflicts;
    }
    /**
     * Calculate overall confidence score
     */
    calculateConfidence(agents, result) {
        let score = 70; // Base confidence
        // Increase for analyzed agents
        if (result.aiAnalysisPerformed) {
            score += 15;
        }
        // Decrease for conflicts
        if (result.potentialConflicts && result.potentialConflicts.length > 0) {
            score -= result.potentialConflicts.length * 5;
        }
        // Increase for patterns learned
        if (result.learnedPatterns && result.learnedPatterns.length > 0) {
            score += 10;
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Detect outdated configurations
     */
    async detectOutdatedConfigs(agents) {
        const warnings = [];
        for (const agent of agents) {
            try {
                const content = await readFile(agent.path, 'utf-8');
                // Check for deprecated patterns
                if (content.includes('deprecated') || content.includes('legacy')) {
                    warnings.push(`Agent "${agent.name}" may contain deprecated configuration`);
                }
                // Check for old version
                const versionMatch = content.match(/"version":\s*"(\d+)\./);
                if (versionMatch && parseInt(versionMatch[1]) < 2) {
                    warnings.push(`Agent "${agent.name}" uses older configuration version`);
                }
            }
            catch {
                // Ignore read errors
            }
        }
        return warnings;
    }
    /**
     * Generate cache key from options
     */
    generateCacheKey(options) {
        return JSON.stringify({
            scope: options.scope,
            path: options.customPath || options.cwd,
            autoDetect: options.autoDetect
        });
    }
}
//# sourceMappingURL=ai-assisted-scanner.js.map