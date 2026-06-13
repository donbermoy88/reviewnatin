/**
 * RichText — lightweight markdown renderer for question stems and explanations.
 *
 * Supported syntax:
 *   **bold**    *italic*    `code`
 *   | col | col |  (tables — first row is header)
 *   - item  /  * item   (bullet list)
 *   1. item             (ordered list)
 *   blank lines separate paragraphs
 */

import React, { memo, useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { useAppTheme, fonts } from '../hooks/use-app-theme';

// ─── Inline tokens ────────────────────────────────────────────────────────────

type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }
  | { kind: 'code'; value: string };

const INLINE_RE = /\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`]+)`/g;

function tokenizeInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  INLINE_RE.lastIndex = 0;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = INLINE_RE.exec(text)) !== null) {
    if (m.index > last) tokens.push({ kind: 'text', value: text.slice(last, m.index) });
    if (m[1] !== undefined) tokens.push({ kind: 'bold', value: m[1] });
    else if (m[2] !== undefined) tokens.push({ kind: 'italic', value: m[2] });
    else if (m[3] !== undefined) tokens.push({ kind: 'code', value: m[3] });
    last = m.index + m[0].length;
  }
  if (last < text.length) tokens.push({ kind: 'text', value: text.slice(last) });
  return tokens;
}

// ─── Block AST ────────────────────────────────────────────────────────────────

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; items: string[] }
  | { kind: 'ordered'; items: string[] }
  | { kind: 'table'; rows: string[][] };

const TABLE_SEP_RE = /^\|[-:\s|]+\|$/;

function parseBlocks(content: string): Block[] {
  const lines = content.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (line === '') { i++; continue; }

    // Table
    if (line.startsWith('|')) {
      const tableRows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const row = lines[i].trim();
        if (!TABLE_SEP_RE.test(row)) {
          const cells = row.split('|').slice(1, -1).map(c => c.trim());
          if (cells.length > 0) tableRows.push(cells);
        }
        i++;
      }
      if (tableRows.length > 0) blocks.push({ kind: 'table', rows: tableRows });
      continue;
    }

    // Bullet list
    if (/^[-*]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'bullet', items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ordered', items });
      continue;
    }

    // Paragraph — accumulate lines until blank or block marker
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].trim().startsWith('|') &&
      !/^[-*]\s/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) blocks.push({ kind: 'paragraph', text: paraLines.join(' ') });
  }

  return blocks;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RichTextProps {
  /** Markdown-flavoured content string */
  content: string;
  /** Base font size (default 15) */
  fontSize?: number;
  /** Override text color */
  color?: string;
  /** Extra style applied to the outer View */
  style?: ViewStyle;
}

// ─── Inline renderer ──────────────────────────────────────────────────────────

interface InlineProps {
  text: string;
  fontSize: number;
  color: string;
  monoFamily: string;
  boldFamily: string;
  regularFamily: string;
  italicFamily: string;
  surfaceColor: string;
}

const InlineText = memo(function InlineText({
  text,
  fontSize,
  color,
  monoFamily,
  boldFamily,
  regularFamily,
  surfaceColor,
}: InlineProps) {
  const tokens = useMemo(() => tokenizeInline(text), [text]);
  const lh = fontSize * 1.5;

  return (
    <Text style={{ fontFamily: regularFamily, fontSize, lineHeight: lh, color }}>
      {tokens.map((tok, idx) => {
        if (tok.kind === 'bold') {
          return (
            <Text key={idx} style={{ fontFamily: boldFamily }}>
              {tok.value}
            </Text>
          );
        }
        if (tok.kind === 'italic') {
          return (
            <Text key={idx} style={{ fontFamily: regularFamily, fontStyle: 'italic' }}>
              {tok.value}
            </Text>
          );
        }
        if (tok.kind === 'code') {
          return (
            <Text
              key={idx}
              style={{
                fontFamily: monoFamily,
                fontSize: fontSize - 1,
                backgroundColor: surfaceColor,
                paddingHorizontal: 3,
                borderRadius: 3,
              }}
            >
              {tok.value}
            </Text>
          );
        }
        return <Text key={idx}>{tok.value}</Text>;
      })}
    </Text>
  );
});

// ─── Main component ───────────────────────────────────────────────────────────

export const RichText = memo(function RichText({
  content,
  fontSize = 15,
  color: colorProp,
  style,
}: RichTextProps) {
  const { colors, isDark } = useAppTheme();
  const color = colorProp ?? colors.text;
  const lh = fontSize * 1.5;

  const blocks = useMemo(() => parseBlocks(content ?? ''), [content]);

  const inlineProps: Omit<InlineProps, 'text'> = {
    fontSize,
    color,
    monoFamily: 'Courier New',
    boldFamily: fonts.bodyBold,
    regularFamily: fonts.body,
    italicFamily: fonts.body,
    surfaceColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
  };

  // Table border color
  const borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)';
  const headerBg = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.04)';

  return (
    <View style={style}>
      {blocks.map((block, bi) => {
        const isLast = bi === blocks.length - 1;
        const mb = isLast ? 0 : fontSize * 0.75;

        if (block.kind === 'paragraph') {
          return (
            <View key={bi} style={{ marginBottom: mb }}>
              <InlineText text={block.text} {...inlineProps} />
            </View>
          );
        }

        if (block.kind === 'bullet') {
          return (
            <View key={bi} style={{ marginBottom: mb }}>
              {block.items.map((item, ii) => (
                <View key={ii} style={styles.listRow}>
                  <Text style={{ fontFamily: fonts.body, fontSize, color, lineHeight: lh, marginRight: 6 }}>
                    {'•'}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <InlineText text={item} {...inlineProps} />
                  </View>
                </View>
              ))}
            </View>
          );
        }

        if (block.kind === 'ordered') {
          return (
            <View key={bi} style={{ marginBottom: mb }}>
              {block.items.map((item, ii) => (
                <View key={ii} style={styles.listRow}>
                  <Text
                    style={{
                      fontFamily: fonts.bodySemiBold,
                      fontSize,
                      color,
                      lineHeight: lh,
                      marginRight: 6,
                      minWidth: 20,
                    }}
                  >
                    {`${ii + 1}.`}
                  </Text>
                  <View style={{ flex: 1 }}>
                    <InlineText text={item} {...inlineProps} />
                  </View>
                </View>
              ))}
            </View>
          );
        }

        if (block.kind === 'table') {
          const [header, ...bodyRows] = block.rows;
          if (!header) return null;
          const colCount = header.length;

          return (
            <View
              key={bi}
              style={[
                styles.table,
                { borderColor, marginBottom: mb },
              ]}
            >
              {/* Header row */}
              <View style={[styles.tableRow, { backgroundColor: headerBg, borderBottomColor: borderColor, borderBottomWidth: 1 }]}>
                {header.map((cell, ci) => (
                  <View
                    key={ci}
                    style={[
                      styles.tableCell,
                      { borderRightColor: borderColor },
                      ci < colCount - 1 && { borderRightWidth: 1 },
                    ]}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.bodyBold,
                        fontSize: fontSize - 1,
                        color,
                        textAlign: 'center',
                      }}
                    >
                      {cell}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Body rows */}
              {bodyRows.map((row, ri) => (
                <View
                  key={ri}
                  style={[
                    styles.tableRow,
                    ri < bodyRows.length - 1 && { borderBottomColor: borderColor, borderBottomWidth: 1 },
                  ]}
                >
                  {Array.from({ length: colCount }).map((_, ci) => (
                    <View
                      key={ci}
                      style={[
                        styles.tableCell,
                        { borderRightColor: borderColor },
                        ci < colCount - 1 && { borderRightWidth: 1 },
                      ]}
                    >
                      <Text
                        style={{
                          fontFamily: fonts.body,
                          fontSize: fontSize - 1,
                          color,
                          textAlign: 'center',
                        }}
                      >
                        {row[ci] ?? ''}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          );
        }

        return null;
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
  },
  table: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
});
