/**
 * Created by 이충렬 on 2022-09-08 : init Commit
 * @Param1 {Object} 옵션
 * ex)
 * Option = {
 *  (필수) sTarget : Target Div ID ex) 'eKeyword'
 *        sType : Target Type ex) 'range','input'(default)
 *        sPlaceholder : Tartget Placeholder ex) '검색어' => 검색어를 입력해주세요 placeholder 자동 셋팅됨
 * }
 * oDefault = 기본 default 입력값 : array ex) ['홍길동','이순신']
 *            if sType == range : {
 *             'start' : 100,
 *             'end'   : 200,
 *             'multi' : [1,2,3,4,5]
 *         }
 */
class MultiInput {

    constructor(oOpt,oDefault)
    {
        this.oOpt = oOpt;
        this.oDefault = oDefault;
        this.sLayer = `#MultiInput_${oOpt['sTarget']}`;
        this._renderInput();
        this._setInitEvent();
        this._setDefault();
        this._getValuesBox();
    }

    _setDefault()
    {
        if( !this.oDefault ){
            return
        };

        let sTarget = this.oOpt['sTarget'];
        let sType = this.oOpt['sType'];
        let oDefault = this.oDefault;

        if( sType == 'range' ){
            if( !oDefault['multi'] ){
                $(`#input_${sTarget}`).val( oDefault['start'] ?? "" );
                $(`#input_${sTarget}_end`).val( oDefault['end'] ?? "" );
                $(`#input_${sTarget}_end, #range_${sTarget}`).show();
                return false;
            }
            $(`#input_${sTarget}_end, #range_${sTarget}`).hide();
            oDefault = oDefault['multi'];
        };

        let aValue = oDefault.filter(i => (i.trim()).length !== 0);

        if( !aValue || aValue.length <= 0) return;
        if( aValue.length == 1 ){
            $(`#input_${sTarget}`).val( aValue );
            return;
        }
        this.aInputed = aValue;
        $(`#input_${sTarget}`).val( `${aValue[0]} 외 ${aValue.length - 1}개` )
    }

    _setInitEvent()
    {
        let sTarget = this.oOpt['sTarget'];
        let sType = this.oOpt['sType'];
        let self = this;
        $(`#btnOpen_${sTarget}`).click(function(e){
            e.stopImmediatePropagation();
            e.preventDefault();
            if( sType == 'range' && $(`#input_${sTarget}_end`).is(":visible")){
                $(`#input_${sTarget}`).val( "" );
                $(`#input_${sTarget}_end`).val( "" ).hide();
                $(`#range_${sTarget}`).hide();
                self.aInputed = null;
            }
            self._openLayer();
        });
        $(`#input_${sTarget}`).change(function(e){
            self.aInputed = null
            self._getValuesBox();
        })
        $(`#input_${sTarget}`).click(function(e){
            e.stopImmediatePropagation();
            e.preventDefault();
            if( sType == 'range' ){
                if( !$(`#input_${sTarget}_end`).is(":visible")){
                    $(`#input_${sTarget}`).val( "" );
                    $(`#input_${sTarget}_end`).val("").show();
                    $(`#range_${sTarget}`).show();
                }
            }else{
                $(`#input_${sTarget}`).val( "" );
            }
            self.aInputed = null
            self._getValuesBox();
        });

        $(`#input_${sTarget}, #input_${sTarget}_end`).change(function(e){
            e.stopImmediatePropagation();
            e.preventDefault();
            self._getValuesBox();
        })
    }

    _renderInput()
    {
        let sTarget = this.oOpt['sTarget'];
        let sType = this.oOpt['sType'];
        let sPlaceholder = this.oOpt['sPlaceholder'];
        sPlaceholder = sPlaceholder ? `${sPlaceholder}${ !this._checkBatchimEnding(sPlaceholder) ? "를" : "을" } 입력해 주세요.` : "";


        let sHtml;
        if(sType == 'range'){
            sHtml = `
                <input type="text" id="input_${sTarget}" class="fText" style="width:40%;"/> <p id="range_${sTarget}" style="display:inline-block;">&nbsp;~&nbsp;</p>
                <input type="text" id="input_${sTarget}_end" class="fText" style="width:40%;"/>
                <a id="btnOpen_${sTarget}" class="btnNormal" style="cursor:pointer;"><span>...</span></a>
            `;
        }else{
            sHtml = `
                <input type="text" id="input_${sTarget}" class="fText" style="width:80%;" placeholder="${sPlaceholder}"/>
                <a id="btnOpen_${sTarget}" class="btnNormal" style="cursor:pointer;"><span>...</span></a>
            `;
        }

        $(`#${sTarget}`).empty().append(sHtml).css('display',"inline-block");
    }

    _openLayer()
    {
        this._addHtml();
        $(this.sLayer).draggable({handle: "h2", containment: 'body'});
        WMS.showLayer(this.sLayer);
        this._setLayerEvent();
    }

    _setLayerEvent()
    {
        let self = this;
        let sTarget = this.oOpt['sTarget'];
        $(`#textarea_${sTarget}`).select();
        $(this.sLayer + ' .eInput').click(async function(e) {
            e.stopImmediatePropagation();
            e.preventDefault();
            self._setInputBox();
            self._getValuesBox();
            $.mLayer_close($(this));
        });
    }

    _setInputBox()
    {
        let sTarget = this.oOpt['sTarget'];
        let sValue = $(`#textarea_${sTarget}`).val();
        if(!sValue){
            this.aInputed = null;
            $(`#input_${sTarget}`).val('');
            return;
        };

        let aValue = (sValue.split("\n")).filter(i => (i.trim()).length !== 0)

        if( aValue.length == 1 ){
            this.aInputed = null;
            $(`#input_${sTarget}`).val( aValue );
            return;
        }
        this.aInputed = aValue;
        $(`#input_${sTarget}`).val( `${aValue[0]} 외 ${aValue.length - 1}개` );
    }

    _addHtml()
    {
        let sTarget = this.oOpt['sTarget'];
        let sValue = (this.aInputed) ? this.aInputed.join('\n') : $(`#input_${sTarget}`).val();
        $(`#${this.sLayer.substr(1)}`).remove();
        $('body').append(`
            <div id="${this.sLayer.substr(1)}" class="mLayer gSmall" style="display:none">
                <h2 class="eTitle">복수 검색</h2>
                    <div class="wrap">
                        <div class="mTitle">
                            <h3 class="eTitle">검색할 값들을 입력해주세요.(한줄에 한개씩)</h3>
                        </div>
                        <div class="mBoard gSmall" style="text-align:center;">
                            <table>
                                <caption>검색값 입력</caption>
                                <colgroup>
                                    <col/>
                                </colgroup>
                                <tbody>
                                <tr>
                                    <td>
                                        <textarea id="textarea_${sTarget}" style="resize:none;width:100%;height:200px;border:none;">${sValue}</textarea> 
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                <div class="footer">
                    <a href="#none" class="btnCtrl eInput"><span>입력</span></a>
                    <a href="#none" class="btnNormal eClose"><span>닫기</span></a>
                </div>
                <button type="button" class="btnClose eClose">닫기</button>
            </div>
        `);
    }

    /*
    * 입력여부 여부 확인 => return (true,false)
    * */
    isInputed()
    {
        let sTarget = this.oOpt['sTarget'];
        return $(`#input_${sTarget}`).val() ? true : false;
    }

    /*
     * get Inputed Value Array Type
     * */
    getInputValue()
    {
        let sTarget = this.oOpt['sTarget'];
        let sType = this.oOpt['sType'];

        if( sType=='range' && $(`#input_${sTarget}_end`).is(":visible")){
            return {
                'start' : $(`#input_${sTarget}`).val() ,
                'end' : $(`#input_${sTarget}_end`).val()
            };
        };

        if( !this.aInputed ){
            if( !$(`#input_${sTarget}`).val() ){
                return null;
            };
            return [$(`#input_${sTarget}`).val()];
        }
        return this.aInputed;
    }


    /*
     * render hidden Box
     * */
    _getValuesBox()
    {
        let sTarget = this.oOpt['sTarget'];
        let sType = this.oOpt['sType'];
        if( sType=='range' && $(`#input_${sTarget}_end`).is(":visible")){
            let sStart = $(`#input_${sTarget}`).val();
            let sEnd = $(`#input_${sTarget}_end`).val();
            $(`#${sTarget}`).children(".multiInputBox").remove();
            $(`#${sTarget}`).append(`
                <input type="hidden" class="multiInputBox" name="start_${sTarget}" value="${sStart}">
                <input type="hidden" class="multiInputBox" name="end_${sTarget}" value="${sEnd}">
            `)
            return;
        };

        let aOld = [];
        $(`#${sTarget}`).children(".multiInputBox").map(function(){
            aOld.push( $(this).val() );
        });
        let aNew = this.getInputValue()||[];

        aOld.forEach((sValue)=>{
            if( !aNew.includes(sValue) ){
                $(`#${sTarget}`).children(`.multiInputBox[value='${sValue}']`).remove();
            }
        })
        aNew.forEach((sValue)=> {
            if (!aOld.includes(sValue)) {
                $(`#${sTarget}`).append(` <input type="hidden" class="multiInputBox" name="${sTarget}[]" value="${sValue.trim()}"> `)
            }
        });
    }

    //조사 셋팅 을/를
    _checkBatchimEnding(word)
    {
        if (typeof word !== 'string') return null;
        word = word.charAt(word.length-1);
        let lastLetter = word[word.length - 1];
        let uni = lastLetter.charCodeAt(0);

        if (uni < 44032 || uni > 55203) return null;

        return (uni - 44032) % 28 != 0;
    }
}



