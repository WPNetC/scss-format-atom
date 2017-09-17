/*
    STILL NEEDS TO HANDLE ARRAY VALUES,
    OTHERWISE WORKS TO CONVERT LINT FILE TO OBJECT.
 */
'use strict';

// Base set of scsslint.yml rules
let rules = {
    BangFormat: {
        enabled: true,
        space_before_bang: true,
        space_after_bang: false
    },
    BemDepth: {
        enabled: false,
        max_elements: 1
    },
    BorderZero: {
        enabled: true,
        convention: 'zero' // or `none`
    },
    ColorKeyword: {
        enabled: true
    },
    ColorVariable: {
        enabled: true
    },
    Comment: {
        enabled: true
    },
    DebugStatement: {
        enabled: true
    },
    DeclarationOrder: {
        enabled: true
    },
    DisableLinterReason: {
        enabled: false
    },
    DuplicateProperty: {
        enabled: true
    },
    ElsePlacement: {
        enabled: true,
        style: 'same_line' // or 'new_line'
    },
    EmptyLineBetweenBlocks: {
        enabled: false,
        ignore_single_line_blocks: true
    },
    EmptyRule: {
        enabled: true
    },
    ExtendDirective: {
        enabled: false
    },
    FinalNewline: {
        enabled: true,
        present: true
    },
    HexLength: {
        enabled: true,
        style: 'short' // or 'long'
    },
    HexNotation: {
        enabled: true,
        style: 'lowercase' // or 'uppercase'
    },
    HexValidation: {
        enabled: true
    },
    IdSelector: {
        enabled: true
    },
    ImportantRule: {
        enabled: true
    },
    ImportPath: {
        enabled: true,
        leading_underscore: false,
        filename_extension: false
    },
    Indentation: {
        enabled: true,
        allow_non_nested_indentation: false,
        character: 'tab', // or 'space'
        width: 1
    },
    LeadingZero: {
        enabled: true,
        style: 'include_zero' // or 'exclude_zero'
    },
    MergeableSelector: {
        enabled: true,
        force_nesting: true
    },
    NameFormat: {
        enabled: true,
        allow_leading_underscore: true,
        convention: 'hyphenated_lowercase' // or 'camel_case', or 'snake_case', or a regex pattern
    },
    NestingDepth: {
        enabled: true,
        max_depth: 4,
        ignore_parent_selectors: false
    },
    PlaceholderInExtend: {
        enabled: true
    },
    PropertyCount: {
        enabled: false,
        include_nested: false,
        max_properties: 10
    },
    PropertySortOrder: {
        enabled: true,
        ignore_unspecified: false,
        min_properties: 2,
        separate_groups: false
    },
    PropertySpelling: {
        enabled: true,
        extra_properties: []
    },
    PropertyUnits: {
        enabled: true,
        global: [
            'ch', 'em', 'ex', 'rem', // Font-relative lengths
            'cm', 'in', 'mm', 'pc', 'pt', 'px', 'q', // Absolute lengths
            'vh', 'vw', 'vmin', 'vmax', // Viewport-percentage lengths
            'deg', 'grad', 'rad', 'turn', // Angle
            'ms', 's', // Duration
            'Hz', 'kHz', // Frequency
            'dpi', 'dpcm', 'dppx', // Resolution
            '%'
        ], // Other
        properties: {}

    },
    QualifyingElement: {
        enabled: true,
        allow_element_with_attribute: false,
        allow_element_with_class: false,
        allow_element_with_id: false
    },
    SelectorDepth: {
        enabled: true,
        max_depth: 3
    },
    SelectorFormat: {
        enabled: true,
        convention: 'hyphenated_lowercase' // or 'strict_BEM', or 'hyphenated_BEM', or 'snake_case', or 'camel_case', or a regex pattern
    },
    Shorthand: {
        enabled: true,
        allowed_shorthands: [1, 2, 3]
    },
    SingleLinePerProperty: {
        enabled: true,
        allow_single_line_rule_sets: true
    },
    SingleLinePerSelector: {
        enabled: true
    },
    SpaceAfterComma: {
        enabled: true,
        style: 'one_space' // or 'no_space', or 'at_least_one_space'
    },
    SpaceAfterPropertyColon: {
        enabled: true,
        style: 'one_space' // or 'no_space', or 'at_least_one_space', or 'aligned'
    },
    SpaceAfterPropertyName: {
        enabled: true
    },
    SpaceAfterVariableName: {
        enabled: true
    },
    SpaceAroundOperator: {
        enabled: true,
        style: 'one_space' // or 'no_space'
    },
    SpaceBeforeBrace: {
        enabled: true,
        style: 'space', // or 'new_line'
        allow_single_line_padding: false
    },
    SpaceBetweenParens: {
        enabled: true,
        spaces: 0
    },
    StringQuotes: {
        enabled: true,
        style: 'double_quotes' // or single_quotes
    },
    TrailingSemicolon: {
        enabled: true
    },
    TrailingWhitespace: {
        enabled: true
    },
    TrailingZero: {
        enabled: false
    },
    TransitionAll: {
        enabled: false
    },
    UnnecessaryMantissa: {
        enabled: true
    },
    UnnecessaryParentReference: {
        enabled: true
    },
    UrlFormat: {
        enabled: true
    },
    UrlQuotes: {
        enabled: true
    },
    VariableForProperty: {
        enabled: false,
        properties: []
    },
    VendorPrefix: {
        enabled: true,
        identifier_list: 'base',
        additional_identifiers: [],
        excluded_identifiers: []
    },
    ZeroUnit: {
        enabled: true
    },
    Compass: {
        enabled: false
    }
};

let parseFile = function (lintText) {

    if (!lintText)
        return rules;

    let lines = lintText.replace(/\r\n/g, '\n').split('\n');
    let hitLinters = false;
    let inRule = false;
    let ruleName = '';
    for (let line of lines) {
        var trimmed = line.trim();
        if (!hitLinters) {
            if (trimmed.indexOf('linters:') > -1) {
                hitLinters = true;
            }
            continue;
        }

        if (inRule) {
            if (trimmed === '') {
                inRule = false;
                ruleName = '';
                continue;
            }
            let parts = trimmed.split(':');
            let ruleParamName = parts[0].trim();

            if (parts.length === 2) {
                let ruleParamValue = parts[1].split('#')[0].trim();
                let val = null;

                let numVal = parseInt(ruleParamValue);
                if (numVal === undefined || isNaN(numVal)) {
                    let boolVal = ruleParamValue === 'true' ? true : ruleParamValue === 'false' ? false : null;
                    if (boolVal === null) {
                        val = ruleParamValue;
                    } else {
                        val = boolVal;
                    }
                } else {
                    val = numVal;
                }

                rules[ruleName][ruleParamName] = val;
            } else {
                // console.log('unusual parts length: ' + parts.length + '\r\n' + trimmed);
            }
        } else {
            if (trimmed === '' || trimmed.indexOf(':') == -1) {
                continue;
            }

            ruleName = trimmed.split(':')[0].trim();
            inRule = true;
        }
    }

    return rules;
}

module.exports = function parseLintFile(lintText) {
    return {
        linterRules: rules,
        parseFile: parseFile(lintText)
    };
};