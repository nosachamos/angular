import {isBlank, isPresent} from 'angular2/src/core/facade/lang';
import {CONST_EXPR} from 'angular2/src/core/facade/lang';
import {ListWrapper, StringMapWrapper} from 'angular2/src/core/facade/collection';
import {OpaqueToken} from 'angular2/src/core/di';

import * as modelModule from './model';

export const NG_VALIDATORS: OpaqueToken = CONST_EXPR(new OpaqueToken("NgValidators"));

/**
 * Provides a set of validators used by form controls.
 *
 * # Example
 *
 * ```
 * var loginControl = new Control("", Validators.required)
 * ```
 */
export class Validators {
  static required(control: modelModule.Control): StringMap<string, boolean> {
    return isBlank(control.value) || control.value == "" ? {"required": true} : null;
  }

  static nullValidator(c: any): StringMap<string, boolean> { return null; }

  static compose(validators: Function[]): Function {
    if (isBlank(validators)) return Validators.nullValidator;

    return function(control: modelModule.Control) {
      var res = ListWrapper.reduce(validators, (res, validator) => {
        var errors = validator(control);
        return isPresent(errors) ? StringMapWrapper.merge(res, errors) : res;
      }, {});
      return StringMapWrapper.isEmpty(res) ? null : res;
    };
  }

  static group(group: modelModule.ControlGroup): StringMap<string, boolean> {
    var res = {};
    StringMapWrapper.forEach(group.controls, (control, name) => {
      if (group.contains(name) && isPresent(control.errors)) {
        Validators._mergeErrors(control, res);
      }
    });
    return StringMapWrapper.isEmpty(res) ? null : res;
  }

  static array(array: modelModule.ControlArray): StringMap<string, boolean> {
    var res = {};
    array.controls.forEach((control) => {
      if (isPresent(control.errors)) {
        Validators._mergeErrors(control, res);
      }
    });
    return StringMapWrapper.isEmpty(res) ? null : res;
  }

  static _mergeErrors(control: modelModule.AbstractControl, res: StringMap<string, any[]>): void {
    StringMapWrapper.forEach(control.errors, (value, error) => {
      if (!StringMapWrapper.contains(res, error)) {
        res[error] = [];
      }
      var current: any[] = res[error];
      current.push(control);
    });
  }
}
