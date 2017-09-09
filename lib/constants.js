function define(name, value) {
    Object.defineProperty(exports, name, {
        value:      value,
        enumerable: true
    });
}

define('LINE_ENDINGS', ['\r\n', '\n']);
/* Main tag types */
define('ROOT_TAG', 'root');
define('CLASS_TAG', 'class');
define('ID_TAG', 'id');
define('IS_BLOCK', 'is-block');
define('MEDIAQUERY_TAG', 'mquery');
define('MIXIN_TAG', 'mixin');
define('PARENT_SELECTOR_TAG', 'rps');
define('VARIABLE_TAG', 'variable');
define('HTML_TAG', 'html-elem');
define('COMMENT_SINGLE_TAG', 'comment-single');
define('COMMENT_MULTI_TAG', 'comment-multi');


/* Single line @ types */
define('INCLUDE_TAG', 'include');
define('IMPORT_TAG', 'import');
define('DEBUG_TAG', 'debug');
define('RETURN_TAG', 'return');
define('EXTEND_TAG', 'extend');
define('WARN_TAG', 'warn');
define('ERROR_TAG', 'error');


/* @ Function types */
define('FUNCTION_TAG', 'func');
define('FUNC_AT_ROOT', 'at_root');
define('FUNC_EACH', 'each');
define('FUNC_ELSE', 'else');
define('FUNC_FONT_FACE', 'fontface');
define('FUNC_FOR', 'for');
define('FUNC_IF', 'if');
define('FUNC_WHILE', 'while');

define('ELEM_NAME', 'el-name');
define('ELEM_DATA', 'el-data');


define('REGEX_COMMENTS', /([\/\*]+)([\s\w#\)\(\-]*)([*\/\r\n]+)/g);